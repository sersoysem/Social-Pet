import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './../../config/FireBaseConfig'
import Colors from './../../constants/Colors'

export default function Category({Category}) {
  const [CategoryList, setCategoryList] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Dogs')

  useEffect(() => {
    GetCategories();
  }, [])

  const GetCategories = async () => {
    setCategoryList([]);
    console.log("📡 Veri çekme başlatıldı");

    const snapshot = await getDocs(collection(db, 'Category'));

    if (snapshot.empty) {
      console.log("⚠️ Category koleksiyonu boş");
      return;
    }

    snapshot.forEach((doc) => {
      setCategoryList(CategoryList => [...CategoryList, doc.data()])
    })
  }

  return (
    <View style={{ marginTop: 20 }}>
      <Text style={{
        fontFamily: "outfit-medium",
        fontSize: 20,
        marginBottom: 10
      }}>
        Kategoriler
      </Text>

      <FlatList
        data={CategoryList}
        horizontal={true}    // <-- YATAY kaydırma
        showsHorizontalScrollIndicator={false}   // <-- Alt scroll barı gizle
        keyExtractor={(item, index) => index.toString()} // FlatList hatasını engellemek için
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory(item.name);
              Category(item.name)

            }}
            style={styles.categoryItem}
          >
            <View style={[
              styles.container,
              selectedCategory == item.name && styles.selectedCategoryContainer
            ]}>
              <Image
                source={{ uri: item?.imageUrl }}
                style={styles.image}
              />
            </View>
            <Text style={styles.categoryText}>
              {item?.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    marginBottom: 5,
    width: 70,
    height: 70,
  },
  selectedCategoryContainer: {
    backgroundColor: Colors.SECONDRY,
    borderColor: Colors.BrdrSECONDRY
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  categoryText: {
    textAlign: 'center',
    fontFamily: 'outfit',
    marginTop: 5,
    fontSize: 12,
  },
  image: {
    width: 40,
    height: 40,
    resizeMode: 'contain'
  }
})
