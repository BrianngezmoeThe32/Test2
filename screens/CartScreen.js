import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import { ref, onValue, remove, update } from 'firebase/database';
import { db, auth } from '../components/firebase';

export default function CartScreen({ navigation }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Please login", "You need to be logged in to view cart");
      navigation.navigate('Login');
      return;
    }

    setLoading(true);
    
    const cartRef = ref(db, `carts/${user.uid}`);
    
    const unsubscribe = onValue(cartRef, (snapshot) => {
      try {
        const data = snapshot.val();
        
        if (data) {
          // Convert object to array
          const items = Object.values(data);
          setCart(items);
        } else {
          setCart([]);
        }
      } catch (error) {
        console.error("Error processing cart data:", error);
        setCart([]);
      }
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("Firebase error:", error);
      Alert.alert("Error", "Could not load cart. Please check your connection.");
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCart();
  };

  const handleRemove = (item) => {
    Alert.alert(
      "Remove Item",
      `Remove "${item.title}" from cart?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => removeFromCart(item)
        }
      ]
    );
  };

  const removeFromCart = async (item) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const itemRef = ref(db, `carts/${user.uid}/${item.id}`);
      await remove(itemRef);
    } catch (error) {
      console.error("Remove error:", error);
      Alert.alert("Error", "Could not remove item from cart");
    }
  };

  const updateQuantity = async (item, newQty) => {
    const user = auth.currentUser;
    if (!user) return;

    if (newQty <= 0) {
      handleRemove(item);
      return;
    }

    setUpdatingItems(prev => ({ ...prev, [item.id]: true }));

    try {
      const itemRef = ref(db, `carts/${user.uid}/${item.id}`);
      await update(itemRef, { 
        ...item, 
        quantity: newQty 
      });
    } catch (error) {
      console.error("Update quantity error:", error);
      Alert.alert("Error", "Could not update quantity");
    } finally {
      setUpdatingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)} each</Text>
        
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
              onPress={() => updateQuantity(item, item.quantity - 1)}
              disabled={updatingItems[item.id] || item.quantity <= 1}
            >
              <Text style={[styles.quantityButtonText, item.quantity <= 1 && styles.quantityButtonTextDisabled]}>
                −
              </Text>
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              {updatingItems[item.id] ? (
                <ActivityIndicator size="small" color="#007bff" />
              ) : (
                <Text style={styles.quantityText}>{item.quantity}</Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => updateQuantity(item, item.quantity + 1)}
              disabled={updatingItems[item.id]}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.subtotal}>
          Subtotal: ${(item.price * item.quantity).toFixed(2)}
        </Text>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemove(item)}
          disabled={updatingItems[item.id]}
        >
          <Text style={styles.removeButtonText}>🗑️ Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading your cart...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {cart.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartIcon}>🛒</Text>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <Text style={styles.emptyCartSubtext}>Add some amazing products to get started!</Text>
          <TouchableOpacity 
            style={styles.continueShoppingButton}
            onPress={() => navigation.navigate('ProductList')}
          >
            <Text style={styles.continueShoppingText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>My Shopping Cart</Text>
            <Text style={styles.cartSummary}>
              {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} • ${getTotalPrice().toFixed(2)}
            </Text>
          </View>

          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.cartList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#007bff']}
              />
            }
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalPrice}>${getTotalPrice().toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
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
  cartHeader: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cartSummary: {
    fontSize: 16,
    color: '#666',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    lineHeight: 20,
  },
  itemPrice: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#007bff',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  quantityButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityButtonTextDisabled: {
    color: '#999999',
  },
  quantityDisplay: {
    marginHorizontal: 16,
    minWidth: 30,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  removeButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  totalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
  },
  checkoutButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCartIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyCartText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6c757d',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  continueShoppingButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  continueShoppingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});