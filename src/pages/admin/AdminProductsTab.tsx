import React, { useState } from 'react';
import { Edit2, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import { SKIN_TYPES } from '../../config/business';
import { useApp } from '../../context/AppContext';
import { apiRequest } from '../../services/api';
import type { Brand, Category, Product } from '../../types';
import { formatBDT } from '../../utils/format';
import { SafeImage } from '../../components/common/SafeImage';

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  onRefresh: () => Promise<void>;
}

const EMPTY_FORM = {
  id: 0,
  name: '',
  sku: '',
  brand_id: 1,
  category_id: 1,
  description: '',
  benefits: '',
  ingredients: '',
  skin_types: ['All Skin Types'] as string[],
  usage_instructions: '',
  image_url: '/src/assets/images/prod_centella_ampoule_1795534769635.jpg',
  gallery_text: '',
  price: 1200,
  original_price: '',
  stock_quantity: 20,
  is_active: true,
  is_featured: false,
  is_bestseller: false,
  is_new_arrival: false,
};

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  products,
  categories,
  brands,
  onRefresh,
}) => {
  const { adminToken, refreshStorefront, notify } = useApp();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const filtered = products.filter((p) => {
    if (catFilter && p.category_id !== catFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      brand_id: brands[0]?.id || 1,
      category_id: categories[0]?.id || 1,
      sku: `FLR-${Date.now().toString().slice(-5)}`,
    });
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      id: p.id,
      name: p.name,
      sku: p.sku,
      brand_id: p.brand_id,
      category_id: p.category_id,
      description: p.description,
      benefits: p.benefits,
      ingredients: p.ingredients,
      skin_types: p.skin_types,
      usage_instructions: p.usage_instructions,
      image_url: p.image_url,
      gallery_text: p.gallery_images.join('\n'),
      price: p.price,
      original_price: p.original_price ? String(p.original_price) : '',
      stock_quantity: p.stock_quantity,
      is_active: p.is_active,
      is_featured: p.is_featured,
      is_bestseller: p.is_bestseller,
      is_new_arrival: p.is_new_arrival,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, addToGallery = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await apiRequest<{ url: string }>(
        '/api/admin/upload',
        {
          method: 'POST',
          body: JSON.stringify({ filename: file.name, dataUrl }),
        },
        adminToken
      );
      if (addToGallery) {
        setForm((prev) => ({
          ...prev,
          gallery_text: prev.gallery_text ? `${prev.gallery_text}\n${res.url}` : res.url,
        }));
      } else {
        setForm((prev) => ({ ...prev, image_url: res.url }));
      }
      notify('Image uploaded successfully.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const galleryList = form.gallery_text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (form.image_url && !galleryList.includes(form.image_url)) {
      galleryList.unshift(form.image_url);
    }
    const payload = {
      ...form,
      original_price: form.original_price ? Number(form.original_price) : null,
      gallery_images: galleryList,
    };

    try {
      if (form.id) {
        await apiRequest(
          `/api/admin/products/${form.id}`,
          { method: 'PUT', body: JSON.stringify(payload) },
          adminToken
        );
        notify('Product updated and synced to storefront.', 'success');
      } else {
        await apiRequest(
          '/api/admin/products',
          { method: 'POST', body: JSON.stringify(payload) },
          adminToken
        );
        notify('New product added to catalog.', 'success');
      }
      setModalOpen(false);
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to save product.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    setConfirmDeleteId(null);
    try {
      const res = await apiRequest<{ archived?: boolean }>(
        `/api/admin/products/${p.id}`,
        { method: 'DELETE' },
        adminToken
      );
      notify(
        res.archived
          ? 'Product archived (preserved in order history).'
          : 'Product deleted from catalog.',
        'info'
      );
      await Promise.all([onRefresh(), refreshStorefront()]);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to delete product.', 'error');
    }
  };

  const toggleSkinType = (st: string) => {
    setForm((prev) => ({
      ...prev,
      skin_types: prev.skin_types.includes(st)
        ? prev.skin_types.filter((x) => x !== st)
        : [...prev.skin_types, st],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, SKU, brand..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE6E3] text-xs focus:outline-none focus:border-[#242424]"
            />
          </div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-[#EAE6E3] text-xs"
          >
            <option value={0}>All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#242424] text-white text-xs uppercase tracking-wider whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Product Inventory Table */}
      <div className="bg-white border border-[#EAE6E3] overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF8F5] border-b border-[#EAE6E3] text-[#777777] uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">Stock</th>
              <th className="py-3 px-4">Flags</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE6E3]">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-[#FAF8F5]">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FAF8F5] border border-[#EAE6E3] shrink-0 overflow-hidden">
                      <SafeImage src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-[#242424]">{p.name}</p>
                      <p className="text-[#777777]">{p.brand_name}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-[#777777]">{p.sku}</td>
                <td className="py-3 px-4">{p.category_name}</td>
                <td className="py-3 px-4 text-right tabular-nums font-medium">
                  {formatBDT(p.price)}
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  <span className={p.stock_quantity === 0 ? 'text-rose-700 font-semibold' : ''}>
                    {p.stock_quantity}
                  </span>
                </td>
                <td className="py-3 px-4 text-[#777777]">
                  {[
                    p.is_active ? 'Active' : 'Hidden',
                    p.is_bestseller ? 'Bestseller' : null,
                    p.is_new_arrival ? 'New' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  {confirmDeleteId === p.id ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="px-2 py-1 bg-rose-700 text-white text-[11px] uppercase tracking-wider"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 border border-[#EAE6E3] text-[#777777] text-[11px] uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${p.name}`}
                        className="p-1.5 text-[#242424] hover:bg-[#EAE6E3]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(p.id)}
                        aria-label={`Delete ${p.name}`}
                        className="p-1.5 text-[#777777] hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE6E3] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE6E3]">
              <h2 className="font-serif text-2xl font-medium text-[#242424]">
                {form.id ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-[#777777] hover:text-[#242424]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1">Brand *</label>
                  <select
                    value={form.brand_id}
                    onChange={(e) => setForm({ ...form, brand_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1">Category *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1">Selling Price (BDT) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1">Original Price (Optional)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1">Primary Image URL or Upload</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="flex-1 px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-xs"
                    />
                    <label className="inline-flex items-center gap-1 px-3 py-2 border border-[#EAE6E3] bg-white cursor-pointer hover:bg-[#FAF8F5]">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleImageUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="uppercase tracking-wider">Additional Gallery Image URLs (one per line)</label>
                  <label className="text-[#242424] underline cursor-pointer">
                    + Upload Gallery Photo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  rows={2}
                  value={form.gallery_text}
                  onChange={(e) => setForm({ ...form, gallery_text: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-xs"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider mb-1">Benefits</label>
                  <input
                    type="text"
                    value={form.benefits}
                    onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
                  />
                </div>
                <div>
                  <label className="block uppercase tracking-wider mb-1">Key Ingredients</label>
                  <input
                    type="text"
                    value={form.ingredients}
                    onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1">Usage Instructions</label>
                <input
                  type="text"
                  value={form.usage_instructions}
                  onChange={(e) => setForm({ ...form, usage_instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EAE6E3] text-sm"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5">Suitable Skin Types</label>
                <div className="flex flex-wrap gap-3">
                  {SKIN_TYPES.map((st) => (
                    <label key={st} className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.skin_types.includes(st)}
                        onChange={() => toggleSkinType(st)}
                        className="accent-[#242424]"
                      />
                      <span>{st}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-5 pt-2 border-t border-[#EAE6E3]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="accent-[#242424]"
                  />
                  <span>Active on Storefront</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="accent-[#242424]"
                  />
                  <span>Featured</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_bestseller}
                    onChange={(e) => setForm({ ...form, is_bestseller: e.target.checked })}
                    className="accent-[#242424]"
                  />
                  <span>Bestseller Section</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_new_arrival}
                    onChange={(e) => setForm({ ...form, is_new_arrival: e.target.checked })}
                    className="accent-[#242424]"
                  />
                  <span>New Arrivals Section</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 border border-[#EAE6E3] text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#242424] text-white text-xs uppercase tracking-wider"
                >
                  {saving ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
