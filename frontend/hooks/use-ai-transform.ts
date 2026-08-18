"use client";

import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import { api } from "@/lib/api";

type AiTransformRequest = {
    type: string;
    prompt?: string;
    width?: number;
    height?: number;
    focusObject?: string;
};

export function usePreviewAiTransform() {
    return useMutation({
        mutationFn: ({
                         photoId,
                         body,
                     }: {
            photoId: string;
            body: AiTransformRequest;
        }) => {
            return api.previewAiTransform(
                photoId,
                body,
            );
        },
    });
}

export function useApplyAiTransform() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
                         photoId,
                         body,
                     }: {
            photoId: string;
            body: AiTransformRequest;
        }) => {
            return api.applyAiTransform(
                photoId,
                body,
            );
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["photos"],
            });
        },
    });
}