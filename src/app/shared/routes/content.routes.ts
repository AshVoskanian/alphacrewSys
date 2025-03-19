import { Routes } from '@angular/router';

export const content: Routes = [
    {
        path: 'dashboard',
        data: {
            title: "sample-page",
            breadcrumb: "sample-page",
        },
        loadChildren: () => import('../../components/pages/pages.routes').then(r => r.pages)
    },
    {
        path: 'sample-page',
        data: {
            title: "sample-page",
            breadcrumb: "sample-page",
        },
        loadChildren: () => import('../../components/sample-page/sample-pages.routes').then(r => r.samplePages)
    },
];
