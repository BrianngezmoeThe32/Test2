import React, { useEffect, useState, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../components/firebase';

export default function ProductListScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => product.category === selectedCategory);
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, products]);

  const fetchProducts = () => {
    setLoading(true);
    fetch('https://fakestoreapi.com/products')
      .then(res => res.json())
      .then(data => { 
        setProducts(data); 
        setFilteredProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        setLoading(false);
      });
  };

  const fetchCategories = () => {
    setCategoryLoading(true);
    fetch('https://fakestoreapi.com/products/categories')
      .then(res => res.json())
      .then(data => { 
        setCategories(['all', ...data]);
        setCategoryLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching categories:', error);
        setCategoryLoading(false);
      });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartButtonText}>🛒 Cart</Text>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            signOut(auth);
            navigation.replace('Login');
          }}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const renderCategoryItem = (category) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.selectedCategoryButton
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === category && styles.selectedCategoryText
      ]}>
        {category === 'all' ? 'All Products' : category.charAt(0).toUpperCase() + category.slice(1)}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.productCategory}>
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </Text>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>⭐ {item.rating?.rate || 'N/A'}</Text>
            <Text style={styles.ratingCount}>({item.rating?.count || 0})</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Categories Section */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {categoryLoading ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(renderCategoryItem)}
          </ScrollView>
        )}
      </View>

      {/* Products Count */}
      <View style={styles.productsHeader}>
        <Text style={styles.productsCount}>
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
        </Text>
        <Text style={styles.selectedCategory}>
          {selectedCategory === 'all' ? 'All categories' : selectedCategory}
        </Text>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProductItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.productsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found in this category</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={styles.retryButtonText}>Show All Products</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  categoriesSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedCategoryButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  productsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  productsCount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategory: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#ffc107',
    marginRight: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#6c757d',
  },
  cartButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cartButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});