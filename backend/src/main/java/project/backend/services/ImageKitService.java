package project.backend.services;

import io.imagekit.client.ImageKitClient;
import io.imagekit.errors.ImageKitException;
import io.imagekit.models.assets.AssetListParams;
import io.imagekit.models.assets.AssetListResponse;
import io.imagekit.models.files.FileDeleteParams;
import io.imagekit.models.files.FileUploadParams;
import io.imagekit.models.files.FileUploadResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import project.backend.config.ImageKitProperties;
import project.backend.domain.User;
import project.backend.exception.BadRequestException;
import project.backend.exception.ImageKitUploadException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
public class ImageKitService {

    private static final int AI_DOWNLOAD_MAX_ATTEMPTS = 12;
    private static final Duration AI_DOWNLOAD_RETRY_DELAY = Duration.ofSeconds(3);

    private final ImageKitClient imageKitClient;
    private final ImageKitProperties imageKitProperties;
    private final HttpClient httpClient;

    public ImageKitService(
            ImageKitClient imageKitClient,
            ImageKitProperties imageKitProperties
    ) {
        this.imageKitClient = imageKitClient;
        this.imageKitProperties = imageKitProperties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }
    public FileUploadResponse uploadPhoto(User user, MultipartFile file) {
        try {
            FileUploadParams params = FileUploadParams.builder()
                    .file(file.getBytes())
                    .fileName(resolveFileName(file))
                    .folder(userFolder(user.getId()))
                    .useUniqueFileName(true)
                    .build();

            return imageKitClient.files().upload(params);
        } catch (ImageKitException ex) {
            throw new ImageKitUploadException("ImageKit upload failed: " + ex.getMessage(), ex);
        } catch (IOException ex) {
            throw new ImageKitUploadException("Failed to read uploaded file", ex);
        }
    }

    public FileUploadResponse uploadBytes(User user, byte[] bytes, String fileName) {
        try {
            FileUploadParams params = FileUploadParams.builder()
                    .file(bytes)
                    .fileName(fileName)
                    .folder(userFolder(user.getId()))
                    .useUniqueFileName(true)
                    .build();

            return imageKitClient.files().upload(params);

        } catch (ImageKitException ex) {
            throw new ImageKitUploadException(
                    "ImageKit upload failed: " + ex.getMessage(),
                    ex
            );
        }
    }

    public void deleteFile(String fileId) {
        try {
            imageKitClient.files().delete(
                    FileDeleteParams.builder()
                            .fileId(fileId)
                            .build()
            );


        } catch (ImageKitException ex) {
            String message = ex.getMessage();

            if (message != null &&
                    message.contains("404")) {
                // File is already gone from ImageKit.
                // Continue deleting the local database record.
                return;
            }

            throw new ImageKitUploadException(
                    "ImageKit delete failed: " + message,
                    ex
            );
        }
    }

    public List<AssetListResponse> listAssetsInFolder(
            String folderPath,
            long skip,
            long limit
    ) {
        try {
            return imageKitClient.assets().list(
                    AssetListParams.builder()
                            .path(folderPath)
                            .skip(skip)
                            .limit(limit)
                            .build()
            );
        } catch (ImageKitException ex) {
            throw new ImageKitUploadException(
                    "Failed to list ImageKit assets: " + ex.getMessage(),
                    ex
            );
        }
    }

    public String buildAiTransformUrl(
            String sourceUrl,
            String transformChain
    ) {
        if (sourceUrl == null || sourceUrl.isBlank()) {
            throw new BadRequestException(
                    "Source URL is required"
            );
        }

        if (transformChain == null
                || transformChain.isBlank()) {
            return sourceUrl;
        }

        String separator =
                sourceUrl.contains("?")
                        ? "&"
                        : "?";

        return sourceUrl
                + separator
                + "tr="
                + transformChain;
    }

    public void validateAiTransform(
            String transformUrl
    ) {
        try {
            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(
                                    URI.create(
                                            transformUrl
                                    )
                            )
                            .timeout(
                                    Duration.ofSeconds(30)
                            )
                            .GET()
                            .build();

            HttpResponse<byte[]> response =
                    httpClient.send(
                            request,
                            HttpResponse.BodyHandlers
                                    .ofByteArray()
                    );

            String intermediate =
                    response.headers()
                            .firstValue(
                                    "is-intermediate-response"
                            )
                            .orElse(
                                    "false"
                            );

            if ("true".equalsIgnoreCase(
                    intermediate
            )) {
                return;
            }

            if (response.statusCode() >= 400) {

                String ikError =
                        response.headers()
                                .firstValue(
                                        "ik-error"
                                )
                                .orElse(
                                        "Unknown ImageKit error"
                                );

                throw new ImageKitUploadException(
                        ikError
                );
            }

        } catch (
                IOException |
                InterruptedException ex
        ) {

            if (ex instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }

            throw new ImageKitUploadException(
                    "Failed to validate AI transformation: "
                            + ex.getMessage(),
                    ex
            );
        }
    }

    public byte[] downloadTransformedImage(String transformUrl) {
        ImageKitUploadException lastError = null;

        for (int attempt = 1; attempt <= AI_DOWNLOAD_MAX_ATTEMPTS; attempt++) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(transformUrl))
                        .timeout(Duration.ofSeconds(90))
                        .GET()
                        .build();

                HttpResponse<byte[]> response =
                        httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

                String intermediate =
                        response.headers()
                                .firstValue("is-intermediate-response")
                                .orElse("false");

                if ("true".equalsIgnoreCase(intermediate)) {
                    sleepBeforeRetry();
                    continue;
                }

                if (response.statusCode() >= 400) {

                    String ikError = response.headers()
                            .firstValue("ik-error")
                            .orElse("No ik-error header returned");

                    String contentType = response.headers()
                            .firstValue("Content-Type")
                            .orElse("unknown");

                    ImageKitUploadException exception =
                            new ImageKitUploadException(
                                    "ImageKit returned HTTP "
                                            + response.statusCode()
                                            + " | ik-error: "
                                            + ikError
                                            + " | content-type: "
                                            + contentType
                            );

                    // Permanent errors should fail immediately.
                    if (response.statusCode() == 400
                            || response.statusCode() == 401
                            || response.statusCode() == 403
                            || response.statusCode() == 404) {

                        throw exception;
                    }

                    throw exception;
                }
                byte[] body = response.body();

                if (body == null || body.length == 0) {
                    throw new ImageKitUploadException(
                            "Transformed image download returned empty content"
                    );
                }

                String contentType =
                        response.headers()
                                .firstValue("Content-Type")
                                .orElse("");

                if (contentType.contains("text/html")) {
                    sleepBeforeRetry();
                    continue;
                }

                return body;

            } catch (ImageKitUploadException ex) {
                throw ex;


            } catch (IOException | InterruptedException ex) {
                if (ex instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }

                lastError = new ImageKitUploadException(
                        "Failed to download transformed image: " + ex.getMessage(),
                        ex
                );

                sleepBeforeRetry();
            }
        }

        throw lastError != null
                ? lastError
                : new ImageKitUploadException(
                "Timed out waiting for AI transformation to finish"
        );
    }


    public String buildThumbnailUrl(String filePath) {
        if (filePath == null || filePath.isBlank()) {
            return filePath;
        }

        String src = filePath.startsWith("/") ? filePath : "/" + filePath;

        return imageKitClient.helper().buildUrl(
                io.imagekit.models.SrcOptions.builder()
                        .urlEndpoint(imageKitProperties.urlEndpoint())
                        .src(src)
                        .addTransformation(
                                io.imagekit.models.Transformation.builder()
                                        .width(400.0)
                                        .height(400.0)
                                        .focus("auto")
                                        .build()
                        )
                        .build()
        );
    }

    public String buildThumbnailUrlFromUrl(String url) {
        if (url == null || url.isBlank()) {
            return url;
        }

        String separator = url.contains("?") ? "&" : "?";
        return url + separator + "tr=w-400,h-400,fo-auto";
    }

    public static String encodePrompt(String prompt) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(prompt.trim().getBytes(StandardCharsets.UTF_8));
    }

    public static String userFolder(UUID userId){
        return "/users" + userId;
    }

    private void sleepBeforeRetry() {
        try {
            Thread.sleep(AI_DOWNLOAD_RETRY_DELAY.toMillis());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    private String resolveFileName(MultipartFile file) {
        String originalName = file.getOriginalFilename();

        if (originalName == null || originalName.isBlank()) {
            throw new BadRequestException("File name is required");
        }

        return originalName;
    }
}
