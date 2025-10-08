import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  SafeAreaView 
} from 'react-native';
import { ref, set, get } from 'firebase/database';
import { db, auth } from '../components/firebase';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const addToCart = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login Required", "Please log in to add items to your cart.");
      navigation.navigate('Login');
      return;
    }

    setAddingToCart(true);

    try {
      const itemRef = ref(db, `carts/${user.uid}/${product.id}`);
      
      // Check if item already exists in cart
      const snapshot = await get(itemRef);
      let newQuantity = quantity;
      
      if (snapshot.exists()) {
        // If item exists, add to existing quantity
        const existingItem = snapshot.val();
        newQuantity = existingItem.quantity + quantity;
      }

      // Add/update item in cart
      await set(itemRef, {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity: newQuantity,
        addedAt: new Date().toISOString()
      });

      Alert.alert(
        "Success!",
        `Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart`,
        [
          {
            text: "Continue Shopping",
            style: "cancel"
          },
          {
            text: "View Cart",
            onPress: () => navigation.navigate('Cart')
          }
        ]
      );
      
      // Reset quantity after adding to cart
      setQuantity(1);
      
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert("Error", "Failed to add item to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: product.image }} 
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* Product Details */}
        <View style={styles.detailsContainer}>
          {/* Category */}
          <Text style={styles.category}>
            {product.category?.charAt(0).toUpperCase() + product.category?.slice(1)}
          </Text>
          
          {/* Title */}
          <Text style={styles.title}>{product.title}</Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>
              ⭐ {product.rating?.rate || 'N/A'} 
              <Text style={styles.ratingCount}> ({product.rating?.count || 0} reviews)</Text>
            </Text>
          </View>
          
          {/* Price */}
          <Text style={styles.price}>${product.price?.toFixed(2)}</Text>
          
          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Quantity Selector */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={[styles.quantityButton, quantity === 1 && styles.quantityButtonDisabled]}
                onPress={decreaseQuantity}
                disabled={quantity === 1}
              >
                <Text style={[styles.quantityButtonText, quantity === 1 && styles.quantityButtonTextDisabled]}>
                  -
                </Text>
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={increaseQuantity}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Total Price */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalPrice}>${(product.price * quantity).toFixed(2)}</Text>
          </View>

          {/* Add to Cart Button */}
          <TouchableOpacity 
            style={[styles.addToCartButton, addingToCart && styles.addToCartButtonDisabled]}
            onPress={addToCart}
            disabled={addingToCart}
          >
            {addingToCart ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.addToCartText}>
                Add to Cart ({quantity})
              </Text>
            )}
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Text style={styles.secondaryButtonText}>View Cart</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  productImage: {
    width: 300,
    height: 300,
    borderRadius: 12,
  },
  detailsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 1,
  },
  category: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 28,
    marginBottom: 12,
  },
  ratingContainer: {
    marginBottom: 16,
  },
  rating: {
    fontSize: 16,
    color: '#ffc107',
    fontWeight: '600',
  },
  ratingCount: {
    color: '#6c757d',
    fontSize: 14,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 20,
  },
  descriptionContainer: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  quantityLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#007bff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  quantityButtonDisabled: {
    backgroundColor: '#6c757d',
    shadowOpacity: 0,
  },
  quantityButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityButtonTextDisabled: {
    color: '#dee2e6',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#28a745',
  },
  addToCartButton: {
    backgroundColor: '#28a745',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#28a745',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addToCartButtonDisabled: {
    backgroundColor: '#6c757d',
    shadowOpacity: 0,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});