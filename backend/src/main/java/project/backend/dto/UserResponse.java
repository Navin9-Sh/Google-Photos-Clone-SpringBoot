package project.backend.dto;

import java.util.UUID;

public record UserResponse(
    UUID is,
    String email,
    String displayName
)
    {
}
