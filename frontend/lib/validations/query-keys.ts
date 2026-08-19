export const authKeys = {
    all: ["auth"] as const,
    me: () => [...authKeys.all, "me"] as const,
};

export const albumKeys = {
    all: ["albums"] as const,
    detail: (id: string) => [...albumKeys.all, id] as const,
    photos: (id: string, page = 0, size = 24) =>
        [...albumKeys.all, id, "photos", page, size] as const,
};

export const photoKeys = {
    all: ["photos"] as const,

    list: (
        userId: string,
        status: string,
        page: number,
        size: number,
    ) =>
        [
            ...photoKeys.all,
            userId,
            "list",
            status,
            page,
            size,
        ] as const,
};