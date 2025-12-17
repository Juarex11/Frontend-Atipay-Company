import React from 'react';
import { ManualPurchaseForm } from '../../components/admin/ManualPurchaseForm';

export const ManualPurchasePage = () => {
    return (
        <div className="p-4">
            {/* Aquí renderizamos el componente que acabamos de crear */}
            <ManualPurchaseForm />
        </div>
    );
};