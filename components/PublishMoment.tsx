import { Image } from "expo-image"
import React, { useState } from "react"
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native"
import { Button, Card, IconButton, Text, TextInput } from "react-native-paper"

interface PublishMomentProps {
  visible: boolean
  onClose: () => void
  onPublish: (content: string, images: string[]) => void
}

const MAX_IMAGES = 9

export function PublishMoment({
  visible,
  onClose,
  onPublish,
}: PublishMomentProps) {
  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])

  const handleAddImage = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("提示", `最多只能上传${MAX_IMAGES}张图片`)
      return
    }

    // 模拟选择图片，实际项目中应该使用图片选择器
    const mockImageUrl = `https://picsum.photos/400/300?random=${Date.now()}`
    setImages([...images, mockImageUrl])
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handlePublish = () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert("提示", "请输入内容或添加图片")
      return
    }

    onPublish(content.trim(), images)
    setContent("")
    setImages([])
    onClose()
  }

  const handleCancel = () => {
    setContent("")
    setImages([])
    onClose()
  }

  if (!visible) return null

  return (
    <View style={styles.overlay}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Button mode="text" onPress={handleCancel}>
              取消
            </Button>
            <Text variant="titleMedium" style={styles.title}>
              发布朋友圈
            </Text>
            <Button
              mode="contained"
              onPress={handlePublish}
              disabled={!content.trim() && images.length === 0}
            >
              发布
            </Button>
          </View>

          <ScrollView style={styles.content}>
            <TextInput
              placeholder="分享你的生活..."
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={6}
              style={styles.textInput}
              mode="outlined"
            />

            <View style={styles.imagesSection}>
              <View style={styles.imagesHeader}>
                <Text variant="titleSmall">
                  图片 ({images.length}/{MAX_IMAGES})
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddImage}
                  disabled={images.length >= MAX_IMAGES}
                >
                  <IconButton
                    icon="plus"
                    iconColor={images.length >= MAX_IMAGES ? "#ccc" : "#007AFF"}
                    size={24}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.imagesGrid}>
                {images.map((imageUrl, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.image}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveImage(index)}
                    >
                      <IconButton
                        icon="close"
                        iconColor="white"
                        size={16}
                        style={styles.removeIcon}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < MAX_IMAGES && (
                  <TouchableOpacity
                    style={[styles.imageItem, styles.addImageItem]}
                    onPress={handleAddImage}
                  >
                    <IconButton icon="plus" iconColor="#ccc" size={32} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </Card.Content>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  card: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontWeight: "bold",
  },
  content: {
    maxHeight: 400,
  },
  textInput: {
    marginBottom: 16,
  },
  imagesSection: {
    marginTop: 8,
  },
  imagesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    borderRadius: 20,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  imageItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeIcon: {
    margin: 0,
  },
  addImageItem: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
})
