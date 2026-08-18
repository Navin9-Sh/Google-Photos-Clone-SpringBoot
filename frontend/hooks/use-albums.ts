"use client";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";
import { albumKeys } from "@/lib/validations/query-keys";

export function useAlbums() {
    return useQuery({
        queryKey: albumKeys.all,
        queryFn: () => api.listAlbums(),
        staleTime: 30 * 1000,
    });
}

export function useCreateAlbum() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (title: string) =>
            api.createAlbum(title),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: albumKeys.all,
            });
        },
    });
}

export function useAlbum(id: string) {
    return useQuery({
        queryKey: albumKeys.detail(id),
        queryFn: () => api.getAlbum(id),
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

export function useAlbumPhotos(
    id: string,
    page = 0,
    size = 24,
) {
    return useQuery({
        queryKey: albumKeys.photos(id, page, size),
        queryFn: () =>
            api.listAlbumPhotos(id, page, size),
        enabled: !!id,
        staleTime: 30 * 1000,
    });
}

export function useAddPhotosToAlbum() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         albumId,
                         photoIds,
                     }: {
            albumId: string;
            photoIds: string[];
        }) =>
            api.addPhotosToAlbum(
                albumId,
                photoIds,
            ),

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: albumKeys.all,
            });

            await queryClient.invalidateQueries({
                queryKey: albumKeys.detail(
                    variables.albumId,
                ),
            });

            await queryClient.invalidateQueries({
                queryKey: albumKeys.photos(
                    variables.albumId,
                ),
            });
        },
    });
}

export function useRemovePhotoFromAlbum() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         albumId,
                         photoId,
                     }: {
            albumId: string;
            photoId: string;
        }) =>
            api.removePhotoFromAlbum(
                albumId,
                photoId,
            ),

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: albumKeys.photos(
                    variables.albumId,
                ),
            });

            await queryClient.invalidateQueries({
                queryKey: albumKeys.detail(
                    variables.albumId,
                ),
            });

            await queryClient.invalidateQueries({
                queryKey: albumKeys.all,
            });
        },
    });
}

export function useUpdateAlbum() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         id,
                         title,
                     }: {
            id: string;
            title: string;
        }) =>
            api.updateAlbum(id, { title }),

        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({
                queryKey: albumKeys.all,
            });

            await queryClient.invalidateQueries({
                queryKey: albumKeys.detail(variables.id),
            });
        },
    });
}

export function useDeleteAlbum() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) =>
            api.deleteAlbum(id),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: albumKeys.all,
            });
        },
    });
}