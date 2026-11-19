//Imports
import { Alert, Image, ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Icon, Text, useTheme } from "react-native-paper";
import { useHabits } from "./flatlist/HabitsContext";
import { CATEGORIES, SHOP_ITEMS, type ShopItem } from "../components/shop/shopitems";

// SHOP PAGE
// Buy items with your apples, then equip them.
// The items come from components/shop/shopItems.ts.

export default function Shop() {
  const theme = useTheme();
  const { apples, owned, equipped, buyItem, toggleEquip } = useHabits();

  // Buy, after a confirmation
  function confirmBuy(item: ShopItem) {
    Alert.alert(`Buy ${item.name}?`, `It costs ${item.price} apples.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Buy", onPress: () => buyItem(item.id) },
    ]);
  }

  // One item: picture, name, price, and a button that depends on its state
  function renderItem(item: ShopItem) {
    const isOwned = owned.includes(item.id);
    const isEquipped = equipped.includes(item.id);
    const canPay = apples >= item.price;

    return (
      <Card
        key={item.id}
        mode="outlined"
        style={[styles.card, isEquipped && { borderColor: theme.colors.primary, borderWidth: 2 }]}
      >
        <Card.Content style={styles.cardContent}>
          {/* Your drawing if there is one, otherwise the placeholder icon */}
          {item.image ? (
            <Image source={item.image} style={styles.picture} resizeMode="contain" />
          ) : (
            <Avatar.Icon icon={item.icon} size={64} />
          )}

          <Text variant="titleSmall" style={styles.name}>
            {item.name}
          </Text>

          {/* The price (only when not owned yet) */}
          {!isOwned && (
            <View style={styles.price}>
              <Icon source="food-apple" size={16} color={theme.colors.primary} />
              <Text variant="bodyMedium">{item.price}</Text>
            </View>
          )}
        </Card.Content>

        <Card.Actions style={styles.actions}>
          {!isOwned ? (
            // Not owned: buy (greyed out without enough apples)
            <Button mode="contained" compact disabled={!canPay} onPress={() => confirmBuy(item)}>
              Buy
            </Button>
          ) : (
            // Owned: equip or take off
            <Button
              mode={isEquipped ? "contained" : "outlined"}
              compact
              icon={isEquipped ? "check" : undefined}
              onPress={() => toggleEquip(item.id)}
            >
              {isEquipped ? "Equipped" : "Equip"}
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Text variant="headlineSmall" style={styles.title}>
        Shop
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.secondary }}>
        Spend your extra apples on your slime's home.
      </Text>

      {/* One section per category */}
      {CATEGORIES.map((category) => (
        <View key={category.id}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {category.title}
          </Text>
          <View style={styles.grid}>
            {SHOP_ITEMS.filter((item) => item.category === category.id).map(renderItem)}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

// STYLES

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingTop: 56,     // room for the burger menu and the apple counter
    paddingBottom: 100, // room for the navbar
  },
  title: {
    fontWeight: "bold",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%", // 2 cards per row
  },
  cardContent: {
    alignItems: "center",
    gap: 6,
  },
  picture: {
    width: 64,
    height: 64,
  },
  name: {
    textAlign: "center",
  },
  price: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actions: {
    justifyContent: "center",
  },
});