import { usePage } from '@inertiajs/react';

export function useCan() {
    const permissions = usePage().props.auth?.user?.permissions ?? [];

    return (permission) => permissions.includes(permission);
}

export function useAuthUser() {
    return usePage().props.auth?.user ?? null;
}
