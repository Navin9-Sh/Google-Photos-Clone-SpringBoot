package project.backend.domain;


import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name="photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "imagekit_file_id", nullable = false)
    private String imagekitFileId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes", nullable = false)
    private Long sizeBytes;

    private Integer width;
    private Integer height;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false,length = 20)
    private PhotoStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "parent_photo_id")
    private UUID parentPhotoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_transform_type", length = 50)
    private AiTransformType aiTransformType;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }

        if (status == null) {
            status = PhotoStatus.ACTIVE;
        }

        if (sizeBytes == null) {
            sizeBytes = 0L;
        }
    }

}
