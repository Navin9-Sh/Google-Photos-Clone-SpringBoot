package project.backend.controllers;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import project.backend.domain.User;
import project.backend.dto.AiTransformPreviewResponse;
import project.backend.dto.AiTransformRequest;
import project.backend.dto.PhotoResponse;
import project.backend.services.AiTransformService;
import project.backend.services.UserService;

import java.util.UUID;

@RestController
@RequestMapping("/api/photos/{photoId}/ai")
public class PhotoAiController {

    private final AiTransformService aiTransformService;
    private final UserService userService;

    public PhotoAiController(
            AiTransformService aiTransformService,
            UserService userService
    ) {
        this.aiTransformService = aiTransformService;
        this.userService = userService;
    }

    @PostMapping("/preview")
    public ResponseEntity<AiTransformPreviewResponse> preview(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID photoId,
            @Valid @RequestBody AiTransformRequest request
    ) {
        User user =
                userService.getByEmail(userDetails.getUsername());

        return ResponseEntity.ok(
                aiTransformService.preview(
                        user,
                        photoId,
                        request
                )
        );
    }

    @PostMapping("/apply")
    public ResponseEntity<PhotoResponse> apply(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID photoId,
            @Valid @RequestBody AiTransformRequest request
    ) {
        User user =
                userService.getByEmail(userDetails.getUsername());

        PhotoResponse photo =
                aiTransformService.apply(
                        user,
                        photoId,
                        request
                );

        return ResponseEntity.ok(photo);
    }
}