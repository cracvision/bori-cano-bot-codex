import wixData from 'wix-data';

const filters = {
  category: null,
  search: null,
  location: null
};

$w.onReady(() => {
  loadProducts();

  if ($w('#dropdownCategory')) {
    $w('#dropdownCategory').onChange(() => {
      filters.category = $w('#dropdownCategory').value;
      loadProducts();
    });
  }

  if ($w('#inputSearch')) {
    $w('#inputSearch').onInput(() => {
      filters.search = $w('#inputSearch').value;
      loadProducts();
    });
  }

  if ($w('#dropdownLocation')) {
    $w('#dropdownLocation').onChange(() => {
      filters.location = $w('#dropdownLocation').value;
      loadProducts();
    });
  }
});

async function loadProducts() {
  let query = wixData.query('ViatorProducts');

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.location) {
    query = query.eq('location', filters.location);
  }

  if (filters.search) {
    const searchQuery = wixData.query('ViatorProducts').contains('title', filters.search);
    query = query.and(searchQuery);
  }

  const { items } = await query.limit(50).find();

  if ($w('#repeaterProducts')) {
    $w('#repeaterProducts').data = items;
    $w('#repeaterProducts').onItemReady(($item, itemData) => {
      $item('#productTitle').text = itemData.title || itemData.name;
      $item('#productImage').src = itemData.image || itemData.imageUrl;
      $item('#productPrice').text = itemData.price ? `$${itemData.price}` : '';
      $item('#productLink').link = `/bori-shop/${itemData.productCode}`;
    });
  }
}
