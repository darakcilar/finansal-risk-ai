import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function DrawerMenu({ isVisible, onClose, onNavigate, user, onLogout }) {
  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isVisible]);

  const handleMenuPress = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      onNavigate(route);
    }, 300);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    setTimeout(() => {
      onLogout();
    }, 300);
  };

  // If not visible and animation is done, we could render null, 
  // but keeping it rendered and transformed is better for performance.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.overlayTouch} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Finansal Risk AI</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>

        <View style={styles.menuItems}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Dashboard')} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>🏠</Text>
            <Text style={styles.menuText}>Ana Ekran</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('MarketData')} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>📈</Text>
            <Text style={styles.menuText}>Canlı Piyasa (TCMB)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Stats')} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>📊</Text>
            <Text style={styles.menuText}>İstatistiklerim</Text>
          </TouchableOpacity>

          {user?.role === 'admin' && (
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Admin')} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>🛡️</Text>
              <Text style={styles.menuText}>Yönetici Paneli</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuPress('Settings')} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuText}>Ayarlar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 100,
  },
  overlayTouch: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.75,
    backgroundColor: COLORS.bgPrimary,
    borderRightWidth: 1,
    borderColor: COLORS.borderGlass,
    zIndex: 101,
    paddingTop: 60,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  greeting: {
    color: COLORS.skyBlue,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  menuItems: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.02)',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  menuText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  logoutText: {
    color: COLORS.accentRed,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
