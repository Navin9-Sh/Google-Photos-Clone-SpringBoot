"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Sparkles,
    WandSparkles,
    X,
} from "lucide-react";

import { usePhotos } from "@/hooks/use-photos";
import {
    useApplyAiTransform,
    usePreviewAiTransform,
} from "@/hooks/use-ai-transform";

import type { Photo } from "@/lib/api";

const AI_FEATURES = [
    {
        type: "REMOVE_BACKGROUND",
        title: "Remove background",
        description: "Isolate the subject with ImageKit AI",
    },
    {
        type: "BACKGROUND_AND_SHADOW",
        title: "Background + shadow",
        description: "Remove background and add a drop shadow",
    },
    {
        type: "CHANGE_BACKGROUND",
        title: "Change background",
        description: "Replace the scene using a text prompt",
    },
    {
        type: "GENERATIVE_FILL",
        title: "Generative fill",
        description: "Extend the canvas with AI-generated content",
    },
    {
        type: "SMART_CROP",
        title: "Smart crop",
        description: "Object-aware crop to a target size",
    },
    {
        type: "OBJECT_CROP",
        title: "Object crop",
        description: "Crop around a named object",
    },
    {
        type: "RETOUCH",
        title: "Retouch",
        description: "Improve overall image quality",
    },
    {
        type: "UPSCALE",
        title: "Upscale",
        description: "Increase resolution with AI upscaling",
    },
    {
        type: "AI_EDIT",
        title: "AI edit",
        description: "Edit the image using a natural language prompt",
    },
];

export default function PhotoAiPage() {
    const router = useRouter();
    const params = useParams();

    const photoId =
        typeof params.id === "string"
            ? params.id
            : "";

    /*
     * We don't currently have a dedicated GET /photos/{id}
     * endpoint in the API code you shared.
     *
     * So for now we retrieve the active photos and find
     * the requested photo.
     */
    const {
        data: photosResponse,
        isLoading: photosLoading,
        isError: photosError,
    } = usePhotos("ACTIVE", 0, 100);

    const photo: Photo | undefined =
        useMemo(() => {
            return photosResponse?.content?.find(
                (item) => item.id === photoId,
            );
        }, [photosResponse, photoId]);

    const previewMutation =
        usePreviewAiTransform();

    const applyMutation =
        useApplyAiTransform();

    const [selectedType, setSelectedType] =
        useState<string>("REMOVE_BACKGROUND");

    const [prompt, setPrompt] =
        useState("");

    const [width, setWidth] =
        useState("1672");

    const [height, setHeight] =
        useState("941");

    const [focusObject, setFocusObject] =
        useState("");

    const [previewUrl, setPreviewUrl] =
        useState<string | null>(null);

    const [savedPhoto, setSavedPhoto] =
        useState<Photo | null>(null);

    const [aiErrorMessage, setAiErrorMessage] = useState("");

    const selectedFeature =
        AI_FEATURES.find(
            (feature) =>
                feature.type === selectedType,
        );

    const needsPrompt =
        selectedType ===
        "CHANGE_BACKGROUND" ||
        selectedType === "GENERATIVE_FILL" ||
        selectedType === "AI_EDIT";

    const needsDimensions =
        selectedType === "GENERATIVE_FILL" ||
        selectedType === "SMART_CROP";

    const needsObject =
        selectedType === "OBJECT_CROP";

    const handleSelectFeature = (
        type: string,
    ) => {
        setSelectedType(type);
        setPreviewUrl(null);

        previewMutation.reset();
        applyMutation.reset();
    };

    const handlePreview = () => {
        if (
            needsPrompt &&
            !prompt.trim()
        ) {
            setAiErrorMessage(
                "Prompt is required. Please enter a valid prompt."
            );

            setPreviewUrl(null);

            setTimeout(() => {
                setAiErrorMessage("");
            }, 3000);

            return;
        }

        if (
            needsObject &&
            !focusObject.trim()
        ) {
            setAiErrorMessage(
                "Object is required. Please enter a valid object."
            );

            setPreviewUrl(null);

            setTimeout(() => {
                setAiErrorMessage("");
            }, 3000);

            return;
        }

        if (!photo) {
            return;
        }

        setAiErrorMessage("");
        setPreviewUrl(null);

        previewMutation.mutate(
            {
                photoId: photo.id,

                body: {
                    type: selectedType,

                    ...(prompt.trim()
                        ? {
                            prompt: prompt.trim(),
                        }
                        : {}),

                    ...(needsDimensions
                        ? {
                            width: Number(width),
                            height: Number(height),
                        }
                        : {}),

                    ...(needsObject
                        ? {
                            focusObject:
                                focusObject.trim(),
                        }
                        : {}),
                },
            },
            {
                onSuccess: (result) => {
                    setPreviewUrl(
                        result.previewUrl,
                    );
                },

                onError: (error) => {
                    const message =
                        error instanceof Error
                            ? error.message
                            : "Failed to generate AI preview.";

                    setPreviewUrl(null);

                    setAiErrorMessage(message);

                    setTimeout(() => {
                        setAiErrorMessage("");
                    }, 4000);
                },
            },
        );
    };
    const handleSave = () => {
        if (!photo) {
            return;
        }

        applyMutation.mutate(
            {
                photoId: photo.id,

                body: {
                    type: selectedType,

                    ...(prompt.trim()
                        ? {
                            prompt:
                                prompt.trim(),
                        }
                        : {}),

                    ...(needsDimensions
                        ? {
                            width:
                                Number(width),
                            height:
                                Number(height),
                        }
                        : {}),

                    ...(needsObject
                        ? {
                            focusObject:
                                focusObject.trim(),
                        }
                        : {}),
                },
            },
            {
                onSuccess: (newPhoto) => {
                    setSavedPhoto(newPhoto);
                    setPreviewUrl(newPhoto.url);

                    setTimeout(() => {
                        setSavedPhoto(null);
                    }, 3000);
                },
            },
        );
    };

    if (photosLoading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    Loading photo...
                </p>
            </div>
        );
    }

    if (
        photosError ||
        !photo
    ) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
                <p className="text-sm text-muted-foreground">
                    Photo could not be found.
                </p>

                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/photos",
                        )
                    }
                    className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
                >
                    Back to photos
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() =>
                        router.push(
                            "/photos",
                        )
                    }
                    className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />

                    Back to photos
                </button>
            </div>

            <div>
                <h1 className="truncate text-2xl font-semibold">
                    {savedPhoto?.fileName ??
                        photo.fileName}
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    {savedPhoto
                        ? "AI transformed photo"
                        : `${photo.width ?? ""} × ${photo.height ?? ""}`}
                </p>
            </div>

            {/* Main editor */}

            <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                {/* AI controls */}

                <div className="rounded-2xl border border-border bg-card p-4">
                    <div className="mb-4 flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" />

                        <h2 className="font-semibold">
                            AI transforms
                        </h2>
                    </div>

                    <div className="space-y-2">
                        {AI_FEATURES.map(
                            (feature) => {
                                const active =
                                    selectedType ===
                                    feature.type;

                                return (
                                    <button
                                        key={
                                            feature.type
                                        }
                                        type="button"
                                        onClick={() =>
                                            handleSelectFeature(
                                                feature.type,
                                            )
                                        }
                                        className={[
                                            "w-full rounded-xl border p-3 text-left transition",
                                            active
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:bg-muted/50",
                                        ].join(
                                            " ",
                                        )}
                                    >
                                        <p className="text-sm font-medium">
                                            {
                                                feature.title
                                            }
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {
                                                feature.description
                                            }
                                        </p>
                                    </button>
                                );
                            },
                        )}
                    </div>

                    {/* Prompt */}

                    {needsPrompt && (
                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium">
                                Prompt
                            </label>

                            <textarea
                                value={prompt}
                                onChange={(
                                    event,
                                ) =>
                                    setPrompt(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="Describe the background or edit you want"
                                className="min-h-[90px] w-full resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-primary"
                            />
                        </div>
                    )}

                    {/* Dimensions */}

                    {needsDimensions && (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Width
                                </label>

                                <input
                                    type="number"
                                    min={64}
                                    max={4096}
                                    value={width}
                                    onChange={(
                                        event,
                                    ) =>
                                        setWidth(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Height
                                </label>

                                <input
                                    type="number"
                                    min={64}
                                    max={4096}
                                    value={height}
                                    onChange={(
                                        event,
                                    ) =>
                                        setHeight(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    )}

                    {/* Object */}

                    {needsObject && (
                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium">
                                Object
                            </label>

                            <input
                                value={
                                    focusObject
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setFocusObject(
                                        event
                                            .target
                                            .value,
                                    )
                                }
                                placeholder="e.g. person, dog, car"
                                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                        </div>
                    )}

                    {/* Preview button */}

                    <button
                        type="button"
                        onClick={handlePreview}
                        disabled={
                            previewMutation.isPending ||
                            applyMutation.isPending
                        }
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <WandSparkles className="size-4" />

                        {previewMutation.isPending
                            ? "Generating..."
                            : "Preview transform"}
                    </button>

                    {/* AI PREVIEW ERROR */}

                    {aiErrorMessage && (
                        <div className="mt-3 rounded-xl border border-red-500 bg-red-500/10 p-3 text-sm text-red-500">
                            {aiErrorMessage}
                        </div>
                    )}

                    {/* Save */}

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={
                            !previewUrl ||
                            applyMutation.isPending
                        }
                        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {applyMutation.isPending
                            ? "Saving to Photos..."
                            : "Save to Photos"}
                    </button>

                    {savedPhoto && (
                        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center">
                            <p className="text-sm font-medium text-primary">
                                ✓ Saved to Photos
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                The transformed photo has been added to your Photos.
                            </p>
                        </div>
                    )}

                    {applyMutation.isError && (
                        <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                            {applyMutation.error instanceof
                            Error
                                ? applyMutation
                                    .error
                                    .message
                                : "Failed to save transformation."}
                        </p>
                    )}

                    <p className="mt-3 text-center text-[11px] text-muted-foreground">
                        Powered by ImageKit AI URL
                        transforms.
                    </p>
                </div>

                {/* Images */}

                <div className="grid gap-5 md:grid-cols-2">
                    {/* Original */}

                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                        <div className="border-b border-border px-4 py-3">
                            <p className="text-sm font-medium">
                                Original
                            </p>
                        </div>

                        <div className="flex min-h-[500px] items-center justify-center bg-black/20 p-4">
                            <img
                                src={
                                    photo.url
                                }
                                alt={
                                    photo.fileName
                                }
                                className="max-h-[65vh] max-w-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Preview */}

                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                        <div className="border-b border-border px-4 py-3">
                            <p className="text-sm font-medium">
                                Preview
                            </p>
                        </div>

                        <div className="flex min-h-[500px] items-center justify-center bg-black/20 p-4">
                            {previewMutation.isPending ? (
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
                                        <Sparkles className="size-8 animate-pulse text-primary" />
                                    </div>

                                    <p className="text-base font-semibold">
                                        AI is working on your image...
                                    </p>

                                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                        Applying{" "}
                                        {selectedFeature?.title ??
                                            "AI transformation"}{" "}
                                        and generating your preview.
                                    </p>

                                    <div className="mt-5 h-2 w-48 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
                                    </div>

                                    <p className="mt-3 text-xs text-muted-foreground">
                                        This may take a few seconds
                                    </p>
                                </div>
                            ) : previewUrl ? (
                                <div className="w-full">
                                    <img
                                        src={previewUrl}
                                        alt="AI preview"
                                        className="mx-auto max-h-[65vh] max-w-full object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Sparkles className="mx-auto mb-3 size-7 text-muted-foreground" />

                                    <p className="text-sm text-muted-foreground">
                                        Select an AI feature and preview the result.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}