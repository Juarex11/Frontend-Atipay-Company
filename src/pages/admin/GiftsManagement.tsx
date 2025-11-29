import { GiftsList } from "@/components/gifts";

export const GiftsManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Regalos</h1>
      </div>
      <GiftsList />
    </div>
  );
};

export default GiftsManagement;
