package project.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import project.backend.domain.RefreshTokens;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokens, UUID> {

    Optional<RefreshTokens> findByToken(String token);

    void deleteByUserId(UUID userId);
}
