package project.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CreatePhotoRequest(
        @NotBlank String imagekitFileId,
        @NotBlank String fileName,
        @NotBlank String url,
        String thumbnailUrl,
        @NotNull String mimeType,
        @NotNull @PositiveOrZero Long sizeBytes,
        Integer width,
        Integer height
) {
}