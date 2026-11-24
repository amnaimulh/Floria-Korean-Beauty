import React, { useState } from 'react';
import { Edit2, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import type { Brand, Category } from '../../types';

interface AdminCategoriesBrandsTabProps {
  categories: Category[];
  brands: Brand[];
  onRefresh: () => Promise<void>;
}

export const AdminCategoriesBrandsTab: React.FC<AdminCategoriesBrandsTabProps> = ({
  categories,
  brands,
  onRefresh,
}) => {
  const { adminToken, refreshStorefront, notify } = useApp();

  // Category Form State
  const [catForm, setCatForm] = useState({
    id: 0,
    name: '',
    name_bn: '',
    description: '',
    image_url: '/src/assets/images/editorial_floria_glow_1795534767638.jpg',
    display_order: 10,
    is_visible: true,
  });

  // Brand Form State
  const [brandForm, setBrandForm] = useState({
    id: 0,
    name: '',
    logo_url: '',
    description: '',
  });

  const handleCatUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await apiRequest<{ url: string }>(
          '/api/admin/upload',
          { method: 'POST', body: JSON.stringify({ filename: file.name, dataUrl: reader.result }) },
          adminToken
        );
        setCatForm((p) => ({ ...p, image_url: res.url }));
        notify('Category image uploaded.', 'success');
      } catch (err) {
        notify(err instanceof Error ? err.message : 'Upload failed.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (catForm.id) {
        await apiRequest(
          `/api/admin/categories/${catForm.id}`,
          { method: 'PUT', body: JSON.stringify(catForm) },
          adminToken
        );
        notify('Category updated.', 'success');
      } else {
        await apiRequest(
          '/api/admin/categories',
          { method: 'POST', body: JSON.stringify(catForm) },
          adminToken
        );
        notify('Category created.', 'success');
      }
      setCatForm({
        id: 0,
        name: '',
        name_bn: '',
        description: '',
        image_url: '/src/assets/images/editorial_floria_glow_1795534767638.jpg',
        display_order: 10,
        is_visible: true,
      });
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save category.', 'error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await apiRequest(`/api/admin/categories/${id}`, { method: 'DELETE' }, adminToken);
      notify('Category deleted.', 'info');
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Cannot delete category.', 'error');
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (brandForm.id) {
        await apiRequest(
          `/api/admin/brands/${brandForm.id}`,
          { method: 'PUT', body: JSON.stringify(brandForm) },
          adminToken
        );
        notify('Brand updated.', 'success');
      } else {
        await apiRequest(
          '/api/admin/brands',
          { method: 'POST', body: JSON.stringify(brandForm) },
          adminToken
        );
        notify('Brand added.', 'success');
      }
      setBrandForm({ id: 0, name: '', logo_url: '', description: '' });
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save brand.', 'error');
    }
  };

  const handleDeleteBrand = async (id: number) => {
    try {
      await apiRequest(`/api/admin/brands/${id}`, { method: 'DELETE' }, adminToken);
      notify('Brand deleted.', 'info');
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Cannot delete brand.', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Categories Management */}
      <div className="space-y-6">
        <div className="bg-white border border-[#EAE6E3] p-6">
          <h2 className="font-serif text-2xl font-medium text-[#242424] mb-4">
            {catForm.id ? 'Edit Category' : 'Add Category'}
          </h2>
          <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Category Name (EN)"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
              <input
                type="text"
                placeholder="Bangla Name"
                value={catForm.name_bn}
                onChange={(e) => setCatForm({ ...catForm, name_bn: e.target.value })}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
            </div>
            <input
              type="text"
              placeholder="Short description"
              value={catForm.description}
              onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Image URL"
                value={catForm.image_url}
                onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })}
                className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
              />
              <label className="inline-flex items-center gap-1 px-3 py-2 border border-[#EAE6E3] cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleCatUpload} className="hidden" />
              </label>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5">
                  <span>Order:</span>
                  <input
                    type="number"
                    value={catForm.display_order}
                    onChange={(e) => setCatForm({ ...catForm, display_order: Number(e.target.value) })}
                    className="w-16 px-2 py-1 bg-[#FAF8F5] border border-[#EAE6E3] tabular-nums"
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catForm.is_visible}
                    onChange={(e) => setCatForm({ ...catForm, is_visible: e.target.checked })}
                    className="accent-[#242424]"
                  />
                  <span>Visible</span>
                </label>
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-2 bg-[#242424] text-white uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{catForm.id ? 'Update' : 'Add'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-[#EAE6E3] divide-y divide-[#EAE6E3]">
          {categories.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-medium text-[#242424]">
                  {c.name} <span className="text-[#777777]">({c.name_bn})</span>
                </p>
                <p className="text-[#777777]">
                  Order {c.display_order} · {c.product_count ?? 0} products ·{' '}
                  {c.is_visible ? 'Visible' : 'Hidden'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCatForm({
                      id: c.id,
                      name: c.name,
                      name_bn: c.name_bn,
                      description: c.description,
                      image_url: c.image_url,
                      display_order: c.display_order,
                      is_visible: c.is_visible,
                    })
                  }
                  className="p-1.5 hover:bg-[#FAF8F5]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.id)}
                  className="p-1.5 text-[#777777] hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Brands Management */}
      <div className="space-y-6">
        <div className="bg-white border border-[#EAE6E3] p-6">
          <h2 className="font-serif text-2xl font-medium text-[#242424] mb-4">
            {brandForm.id ? 'Edit Brand' : 'Add Brand'}
          </h2>
          <form onSubmit={handleSaveBrand} className="space-y-3 text-xs">
            <input
              type="text"
              required
              placeholder="Brand Name"
              value={brandForm.name}
              onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
            />
            <input
              type="text"
              placeholder="Logo URL (Optional)"
              value={brandForm.logo_url}
              onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
            />
            <input
              type="text"
              placeholder="Description"
              value={brandForm.description}
              onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-2 bg-[#242424] text-white uppercase tracking-wider"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{brandForm.id ? 'Update' : 'Add Brand'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-[#EAE6E3] divide-y divide-[#EAE6E3] max-h-[520px] overflow-y-auto">
          {brands.map((b) => (
            <div key={b.id} className="p-4 flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-medium text-[#242424]">{b.name}</p>
                <p className="text-[#777777]">{b.product_count ?? 0} products</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setBrandForm({
                      id: b.id,
                      name: b.name,
                      logo_url: b.logo_url,
                      description: b.description,
                    })
                  }
                  className="p-1.5 hover:bg-[#FAF8F5]"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBrand(b.id)}
                  className="p-1.5 text-[#777777] hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
