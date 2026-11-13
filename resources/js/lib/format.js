export const cx = (...classes) => classes.filter(Boolean).join(' ');

export function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatNumber(value) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number.toLocaleString('en-GB') : '0';
}

export function titleCase(value) {
    if (!value) return '—';
    return String(value)
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function statusTone(value) {
    const key = String(value ?? '').toLowerCase();

    if (['active', 'good', 'returned', 'in_use', 'picked_up', 'dropped_off', 'published', 'available', 'permanent'].includes(key)) {
        return 'emerald';
    }
    if (['maintenance', 'observation', 'minor_damage', 'suspended', 'late', 'contract', 'part_time', 'in_storage'].includes(key)) {
        return 'amber';
    }
    if (['broken', 'major_damage', 'retired', 'overdue', 'absent', 'inactive', 'referred_to_hospital', 'expired', 'lost', 'intern'].includes(key)) {
        return 'rose';
    }
    if (['borrowed', 'observation'].includes(key)) return 'sky';

    return 'slate';
}

export function todayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export function nowLocalInput() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

export function initials(name) {
    if (!name) return '?';
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}
