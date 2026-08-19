"use client";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    api,
    type PhotoStatus,
} from "@/lib/api";
import { photoKeys } from "@/lib/validations/query-keys";

import { useAuthStore } from "@/stores/auth-store";
export function usePhotos(
    status: PhotoStatus = "ACTIVE",
    page = 0,
    size = 24,
) {
    const user = useAuthStore((state) => state.user);
    const accessToken = useAuthStore((state) => state.accessToken);
    const isReady = useAuthStore((state) => state.isReady);

    return useQuery({
        queryKey: photoKeys.list(
            user?.id ?? "anonymous",
            status,
            page,
            size,
        ),

        queryFn: () =>
            api.listPhotos(status, page, size),

        enabled: isReady && !!accessToken && !!user,

        staleTime: 30 * 1000,
    });
}

export function useUploadPhotos() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
                               files,
                               onProgress,
                           }: {
            files: File[];
            onProgress?: (
                completed: number,
                total: number,
                fileName: string,
            ) => void;
        }) => {
            const uploadedPhotos = [];

            for (let index = 0; index < files.length; index++) {
                const file = files[index];

                const photo = await api.uploadPhoto(file);

                uploadedPhotos.push(photo);

                onProgress?.(
                    index + 1,
                    files.length,
                    file.name,
                );
            }

            return uploadedPhotos;
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: photoKeys.all,
            });

            await queryClient.refetchQueries({
                queryKey: photoKeys.all,
            });
        },
    });
}

export function useArchivePhotos() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (photoIds: string[]) =>
            api.archivePhotos(photoIds),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: photoKeys.all,
            });
        },
    });
}

export function useRestorePhotos() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (photoIds: string[]) =>
            api.restorePhotos(photoIds),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: photoKeys.all,
            });
        },
    });
}

export function usePermanentlyDeletePhotos() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (photoIds: string[]) =>
            api.permanentlyDeletePhotos(photoIds),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: photoKeys.all,
            });
        },
    });
}

export function useMovePhotosToTrash() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (photoIds: string[]) =>
            api.movePhotosToTrash(photoIds),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: photoKeys.all,
            });
        },
    });
}

export function useImageKitAssets(enabled = false) {
    return useQuery({
        queryKey: ["imagekit-assets"],
        queryFn: () => api.listImageKitAssets(),
        enabled,
        staleTime: 30 * 1000,
    });
}

export function useImportImageKitAssets() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (imagekitFileIds: string[]) =>
            api.importImageKitAssets(imagekitFileIds),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: photoKeys.all,
            });

            await queryClient.invalidateQueries({
                queryKey: ["imagekit-assets"],
            });
        },
    });
}