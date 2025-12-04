# ProductsPage - Visual UI Preview

## Table Structure

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  PRODUK INDUK                      [+ Tambah]   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Cari produk...  🔍                                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  NAMA PRODUK  │  SKU  │  KATEGORI  │  HARGA  │  TERJUAL  │  FORM  │    AKSI   │
│───────────────┼───────┼────────────┼─────────┼───────────┼────────┼───────────│
│  Laptop Pro   │ LP001 │ Elektronik │Rp500K  │    12     │   2    │    ⋮      │
│               │       │            │        │  (badge)  │(badge) │           │
├───────────────┼───────┼────────────┼─────────┼───────────┼────────┼───────────┤
│  Mouse Wireless│MS002 │ Aksesoris  │Rp150K  │     5     │   1    │    ⋮      │
│               │       │            │        │  (badge)  │(badge) │           │
├───────────────┼───────┼────────────┼─────────┼───────────┼────────┼───────────┤
│  Keyboard RGB │KB003 │ Aksesoris  │Rp300K  │     8     │   3    │    ⋮      │
│               │       │            │        │  (badge)  │(badge) │           │
└───────────────┴───────┴────────────┴─────────┴───────────┴────────┴───────────┘
```

## Badge Styling

### Sales Count (Blue Badge)
```
┌─────────┐
│   12    │  <- rounded-full, bg-blue-100, text-blue-700
└─────────┘     Dark: bg-blue-900, text-blue-200
                Font: semibold, text-sm
```

### Form Count (Purple Badge)  
```
┌─────────┐
│    2    │  <- rounded-full, bg-purple-100, text-purple-700
└─────────┘     Dark: bg-purple-900, text-purple-200
                Font: semibold, text-sm
```

## Dropdown Menu

### Closed State
```
┌───────────────────────────────┐
│ Laptop Pro │LP001│...│Rp500K │ ⋮ │
└───────────────────────────────┘ ↑ 
                                  Click here
```

### Open State
```
┌───────────────────────────────────────────────────┐
│ Laptop Pro │LP001│...│Rp500K │ ⋮ │               │
└───────────────────────────────────────────────────┘
              ┌─────────────────────────────────────┐
              │ ✎ Edit Produk                       │
              ├─────────────────────────────────────┤
              │ 📋 Lihat Form (2)                   │
              ├─────────────────────────────────────┤
              │ ⚡ Penjualan (12)                   │
              ├─────────────────────────────────────┤
              │ 📊 Analytics                        │
              ├─────────────────────────────────────┤
              │ 🗑️  Hapus Produk                   │
              └─────────────────────────────────────┘
```

## Dropdown Menu Items Details

### 1. Edit Produk
- **Icon**: Pencil icon (✎)
- **Action**: Navigate to `/produk/edit/{productId}`
- **Function**: Open product edit form
- **Styling**: Default (slate-900 text)

### 2. Lihat Form (X)
- **Icon**: Document/File icon (📋)
- **Count**: Shows number of linked forms
- **Action**: Navigate to `/produk/{productId}/forms`
- **Function**: View all forms assigned to this product
- **Styling**: Default (slate-900 text)
- **Example**: "Lihat Form (2)" = product has 2 forms

### 3. Penjualan (X)
- **Icon**: Lightning/Bolt icon (⚡)
- **Count**: Shows number of delivered orders
- **Action**: Navigate to `/produk/{productId}/sales`
- **Function**: View sales metrics and order details
- **Styling**: Default (slate-900 text)
- **Example**: "Penjualan (12)" = product has 12 delivered orders

### 4. Analytics
- **Icon**: Chart/Graph icon (📊)
- **Action**: Navigate to `/produk/{productId}/analytics`
- **Function**: View comprehensive analytics and performance
- **Styling**: Default (slate-900 text)

### 5. Hapus Produk
- **Icon**: Trash icon (🗑️)
- **Action**: Soft delete (archive) the product
- **Styling**: Red text (text-red-600) for destructive action
- **Dark Mode**: Red (text-red-400)
- **Behavior**: Shows confirmation dialog first

## Styling Breakdown

### Table Header
```
Background: bg-slate-50 (light), bg-slate-700 (dark)
Border: border-b border-slate-200 (light), border-slate-600 (dark)
Text: text-slate-900 (light), text-slate-100 (dark)
Font: font-semibold
Padding: px-6 py-3
```

### Table Rows
```
Hover: hover:bg-slate-50 (light), hover:bg-slate-700 (dark)
Border: border-b border-slate-200 (light), border-slate-600 (dark)
Text: text-slate-900 (light), text-slate-100 (dark)
Padding: px-6 py-4
```

### Dropdown Menu
```
Background: bg-white (light), bg-slate-700 (dark)
Border: border border-slate-200 (light), border-slate-600 (dark)
Shadow: shadow-lg
Position: absolute right-0 mt-8
Z-index: z-10
Width: w-48
Border-radius: rounded-lg

Menu Items:
├─ Padding: px-4 py-3
├─ Text: text-slate-900 (light), text-slate-100 (dark)
├─ Hover: hover:bg-slate-100 (light), hover:bg-slate-600 (dark)
├─ Border: border-b border-slate-200 (light), border-slate-600 (dark)
├─ Display: flex items-center gap-2
└─ Last item (Hapus): text-red-600 (light), text-red-400 (dark)

Destructive Item (Hapus):
├─ Text: text-red-600 (light), text-red-400 (dark)
└─ Hover: hover:bg-red-50 (light), hover:bg-red-900/20 (dark)
```

### Icons in Dropdown
```
Size: w-4 h-4 (smaller than usual)
Type: SVG inline or component
Color: inherit from text
Styling: 
├─ Edit: PencilIcon component
├─ Form: Document SVG inline
├─ Sales: Lightning SVG inline
├─ Analytics: Chart SVG inline
└─ Delete: TrashIcon component
```

## Dark Mode Comparison

### Light Mode
```
┌──────────────────────────────────────┐
│ Product List                         │
├──────────────────────────────────────┤
│ White background (bg-white)          │
│ Dark text (text-slate-900)           │
│ Light gray hover (hover:bg-slate-50) │
│ Blue badges (bg-blue-100)            │
│ Purple badges (bg-purple-100)        │
└──────────────────────────────────────┘
```

### Dark Mode
```
┌──────────────────────────────────────┐
│ Product List                         │
├──────────────────────────────────────┤
│ Dark background (bg-slate-800)       │
│ Light text (text-slate-100)          │
│ Dark gray hover (hover:bg-slate-700) │
│ Dark blue badges (bg-blue-900)       │
│ Dark purple badges (bg-purple-900)   │
└──────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (Full Width)
```
Table fully visible, all columns displayed properly
Dropdown positioned to right of button
```

### Tablet
```
Table horizontally scrollable
Dropdown may extend beyond viewport (consider positioning)
Touch-friendly (buttons larger padding)
```

### Mobile
```
Table scrolls horizontally
Dropdown: positioned carefully to fit on screen
Consider moving to modal on very small screens
```

## Loading States

### Initial Load
```
Loading...
```

### No Products
```
Belum ada produk. Tambahkan produk baru untuk mulai melacak formulir.
```

### Normal State
```
Products displayed with stats and dropdown menu
```

## Animation & Transition

### Dropdown Toggle
```
Open: appear instantly (can add fade transition if needed)
Close: disappear instantly (can add fade transition if needed)
```

### Button Hover
```
Dropdown button: hover:bg-slate-200 (light), hover:bg-slate-600 (dark)
Transition: transition (smooth)
```

### Menu Item Hover
```
All items: hover:bg-slate-100 (light), hover:bg-slate-600 (dark)
Except last: hover:bg-red-50 (light), hover:bg-red-900/20 (dark)
Transition: instant (no explicit transition class)
```

## Accessibility

### Keyboard Navigation
- Tab through dropdown items (via button focus)
- Not fully accessible (no arrow key navigation implemented)
- Consider adding for production

### Screen Readers
- Icons have no aria-label (consider adding)
- Buttons have title attributes for tooltips
- Consider adding aria-label="More actions" to dropdown button

### Color Contrast
- ✅ Blue badge: meets WCAG AA standard
- ✅ Purple badge: meets WCAG AA standard
- ✅ Red delete button: meets WCAG AA standard

---

## Summary

The ProductsPage now displays:
1. **Product Information**: Name, SKU, Category, Price
2. **Sales Metrics**: Terjual (blue badge), Form (purple badge)
3. **Actions**: Dropdown menu with 5 operations
4. **Dark Mode**: Full support across all elements
5. **Responsive**: Works on desktop, tablet, mobile

All UI elements use Tailwind CSS for consistent styling and dark mode support.
