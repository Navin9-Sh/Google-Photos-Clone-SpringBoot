import { useAuthStore } from "@/stores/auth-store";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

const SESSION_EXPIRED_MESSAGE =
    "Your session has expired. Please log in again.";

export type User = {
    id: string;
    email: string;
    displayName: string;
};

export type AuthResponse = {
    accessToken: string;
    refreshToken: string;
    user: User;
};

export type PhotoStatus = "ACTIVE" | "ARCHIVE" | "TRASH";

export type Photo = {
    id: string;
    imagekitFileId: string;
    fileName: string;
    url: string;
    thumbnailUrl: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    status: PhotoStatus;
    createdAt: string;
    deletedAt: string | null;
    parentPhotoId: string | null;
    aiTransformType: string | null;
};

export type Album = {
    id: string;
    title: string;
    coverPhotoId: string | null;
    coverThumbnailUrl: string | null;
    photoCount: number;
    createdAt: string;
    updatedAt: string;
};

export type ImageKitAsset = {
    fileId: string;
    fileName: string;
    url: string;
    thumbnailUrl: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    mimeType: string | null;
    alreadyImported: boolean;
};

export type PageResponse<T> = {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const refreshToken =
            useAuthStore.getState().refreshToken;

        if (!refreshToken) {
            return null;
        }

        try {
            const response = await fetch(
                `${API_URL}/auth/refresh`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        refreshToken,
                    }),
                },
            );

            if (!response.ok) {
                useAuthStore.getState().clearAuth();
                return null;
            }

            const auth: AuthResponse =
                await response.json();

            useAuthStore.getState().setAuth(auth);

            return auth.accessToken;
        } catch {
            useAuthStore.getState().clearAuth();
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function request<T>(
    path: string,
    options: RequestInit = {},
    auth = true,
    isRetry = false,
): Promise<T> {
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (auth) {
        const token = useAuthStore.getState().accessToken;

        if (token) {
            headers.set(
                "Authorization",
                `Bearer ${token}`,
            );
        }
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    if (
        auth &&
        response.status === 401 &&
        !isRetry
    ) {
        const newAccessToken =
            await refreshAccessToken();

        if (newAccessToken) {
            const retryHeaders = new Headers(
                options.headers,
            );

            if (!(options.body instanceof FormData)) {
                retryHeaders.set(
                    "Content-Type",
                    "application/json",
                );
            }

            retryHeaders.set(
                "Authorization",
                `Bearer ${newAccessToken}`,
            );

            const retryResponse = await fetch(
                `${API_URL}${path}`,
                {
                    ...options,
                    headers: retryHeaders,
                },
            );

            if (retryResponse.status === 401) {
                useAuthStore.getState().clearAuth();

                throw new Error(
                    SESSION_EXPIRED_MESSAGE
                );
            }

            if (!retryResponse.ok) {
                let message = "Request failed";

                try {
                    const body =
                        await retryResponse.json();

                    if (body?.message) {
                        message = body.message;
                    }
                } catch {
                    // Ignore JSON parse errors
                }

                throw new Error(message);
            }

            if (retryResponse.status === 204) {
                return undefined as T;
            }

            return retryResponse.json();
        }

        throw new Error(
            SESSION_EXPIRED_MESSAGE
        );
    }

    if (!response.ok) {
        let message = "Request failed";

        try {
            const body = await response.json();

            if (body?.message) {
                message = body.message;
            }
        } catch {
            // Ignore JSON parse errors
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}

export const api = {
    register: (
        body: {
            email: string;
            password: string;
            displayName: string;
        },
    ) =>
        request<AuthResponse>(
            "/auth/register",
            {
                method: "POST",
                body: JSON.stringify(body),
            },
            false,
        ),

    login: (
        body: {
            email: string;
            password: string;
        },
    ) =>
        request<AuthResponse>(
            "/auth/login",
            {
                method: "POST",
                body: JSON.stringify(body),
            },
            false,
        ),

    refresh: (refreshToken: string) =>
        request<AuthResponse>(
            "/auth/refresh",
            {
                method: "POST",
                body: JSON.stringify({
                    refreshToken,
                }),
            },
            false,
        ),

    logout: () => {
        const refreshToken =
            useAuthStore.getState().refreshToken;

        return request<void>(
            "/auth/logout",
            {
                method: "POST",
                body: JSON.stringify({
                    refreshToken,
                }),
            },
            false,
        );
    },

    me: () => request<User>("/auth/me"),

    listAlbums: () =>
        request<Album[]>("/albums"),

    createAlbum: (title: string) =>
        request<Album>("/albums", {
            method: "POST",
            body: JSON.stringify({ title }),
        }),

    getAlbum: (id: string) =>
        request<Album>(`/albums/${id}`),

    listAlbumPhotos: (
        id: string,
        page = 0,
        size = 24,
    ) =>
        request<PageResponse<Photo>>(
            `/albums/${id}/photos?page=${page}&size=${size}`,
        ),

    addPhotosToAlbum: (
        albumId: string,
        photoIds: string[],
    ) =>
        request<void>(`/albums/${albumId}/photos`, {
            method: "POST",
            body: JSON.stringify({
                photoIds,
            }),
        }),

    removePhotoFromAlbum: (
        albumId: string,
        photoId: string,
    ) =>
        request<void>(
            `/albums/${albumId}/photos/${photoId}`,
            {
                method: "DELETE",
            },
        ),

    updateAlbum: (
        id: string,
        body: {
            title?: string;
            coverPhotoId?: string;
        },
    ) =>
        request<Album>(`/albums/${id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
        }),

    deleteAlbum: (id: string) =>
        request<void>(`/albums/${id}`, {
            method: "DELETE",
        }),

    // -------------------------
    // AI Transformations
    // -------------------------

    previewAiTransform: (
        photoId: string,
        body: {
            type: string;
            prompt?: string;
            width?: number;
            height?: number;
            focusObject?: string;
        },
    ) =>
        request<{
            previewUrl: string;
            type: string;
            transformChain: string;
        }>(
            `/photos/${photoId}/ai/preview`,
            {
                method: "POST",
                body: JSON.stringify(body),
            },
        ),

    applyAiTransform: (
        photoId: string,
        body: {
            type: string;
            prompt?: string;
            width?: number;
            height?: number;
            focusObject?: string;
        },
    ) =>
        request<Photo>(
            `/photos/${photoId}/ai/apply`,
            {
                method: "POST",
                body: JSON.stringify(body),
            },
        ),

    // -------------------------
    // Photos
    // -------------------------

    listPhotos: (
        status: PhotoStatus = "ACTIVE",
        page = 0,
        size = 24,
    ) =>
        request<PageResponse<Photo>>(
            `/photos?status=${status}&page=${page}&size=${size}`,
        ),

    uploadPhoto: (file: File) => {
        const formData = new FormData();

        formData.append("file", file);

        return request<Photo>(
            "/photos/upload",
            {
                method: "POST",
                body: formData,
            },
        );
    },

    archivePhotos: (photoIds: string[]) =>
        request<void>("/photos/archive", {
            method: "POST",
            body: JSON.stringify({ photoIds }),
        }),

    movePhotosToTrash: (photoIds: string[]) =>
        request<void>("/photos/trash", {
            method: "POST",
            body: JSON.stringify({ photoIds }),
        }),

    restorePhotos: (photoIds: string[]) =>
        request<void>("/photos/restore", {
            method: "POST",
            body: JSON.stringify({ photoIds }),
        }),

    permanentlyDeletePhotos: (photoIds: string[]) =>
        request<void>("/photos/delete-permanent", {
            method: "POST",
            body: JSON.stringify({ photoIds }),
        }),

    listImageKitAssets: () =>
        request<ImageKitAsset[]>("/library/imagekit-assets"),

    importImageKitAssets: (imagekitFileIds: string[]) =>
        request<Photo[]>("/library/import", {
            method: "POST",
            body: JSON.stringify({
                imagekitFileIds,
            }),
        }),
};