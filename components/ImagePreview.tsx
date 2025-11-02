import { MomentImage } from "@/utils/mockApi"
import { Image } from "expo-image"
import React, { useEffect, useState } from "react"
import {
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import { IconButton, Portal, Text } from "react-native-paper"

interface ImagePreviewProps {
  visible: boolean
  images: MomentImage[]
  initialIndex: number
  onClose: () => void
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window")

export function ImagePreview({
  visible,
  images,
  initialIndex,
  onClose,
}: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleImagePress = () => {
    // 可以在这里添加双击放大等功能
  }

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  if (!visible || images.length === 0) return null

  return (
    <Portal>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text variant="titleMedium" style={styles.counter}>
              {currentIndex + 1} / {images.length}
            </Text>
            <IconButton
              icon="close"
              iconColor="white"
              size={24}
              onPress={onClose}
            />
          </View>

          <View style={styles.imageContainer}>
            <TouchableOpacity
              style={styles.imageWrapper}
              onPress={handleImagePress}
              activeOpacity={1}
            >
              <Image
                source={{ uri: images[currentIndex].thumbnail }}
                style={styles.image}
                contentFit="contain"
              />
            </TouchableOpacity>

            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={goToPrevious}
              >
                <IconButton icon="chevron-left" iconColor="white" size={32} />
              </TouchableOpacity>
            )}

            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={goToNext}
              >
                <IconButton icon="chevron-right" iconColor="white" size={32} />
              </TouchableOpacity>
            )}
          </View>

          {images.length > 1 && (
            <View style={styles.indicators}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === currentIndex && styles.activeIndicator,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  counter: {
    color: "white",
    fontWeight: "bold",
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  imageWrapper: {
    width: screenWidth,
    height: screenHeight * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  indicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  activeIndicator: {
    backgroundColor: "white",
  },
})
