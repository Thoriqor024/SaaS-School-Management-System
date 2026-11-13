import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });

createInertiaApp({
    resolve: (name) => {
        const page = pages[`./Pages/${name}.jsx`];

        if (!page) {
            throw new Error(`Inertia page not found: ${name}`);
        }

        return page;
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    title: (title) => (title ? `${title} · SiswaHub` : 'SiswaHub'),
    progress: {
        color: '#4f46e5',
        showSpinner: false,
    },
});
