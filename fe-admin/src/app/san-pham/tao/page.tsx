import ProductForm from '@/components/products/ProductForm';

export default function CreateProductPage() {
  return (
    <div style={{ padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <ProductForm />
      </div>
    </div>
  );
}
