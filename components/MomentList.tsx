import { Moment, MomentImage } from "@/utils/mockApi"
import { Image } from "expo-image"
import React from "react"
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native"
import { Avatar, Card, IconButton, Text } from "react-native-paper"

interface MomentListProps {
  moments: Moment[]
  onLike: (momentId: string) => void
  onImagePress: (images: MomentImage[], index: number) => void
}

export function MomentList({ moments, onLike, onImagePress }: MomentListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString()
    }
  }

  const renderImages = (images: MomentImage[]) => {
    if (images.length === 0) return null

    const getImageLayout = (count: number) => {
      if (count === 1) return { width: 200, height: 200 }
      if (count === 2) return { width: 100, height: 100 }
      if (count === 3) return { width: 100, height: 100 }
      if (count === 4) return { width: 100, height: 100 }
      return { width: 100, height: 100 }
    }

    const layout = getImageLayout(images.length)
    const maxImages = 9
    const displayImages = images.slice(0, maxImages)
    const remainingCount = images.length - maxImages

    return (
      <View style={styles.imagesContainer}>
        {displayImages.map((image, index) => (
          <TouchableOpacity
            key={image.id}
            style={[
              styles.imageWrapper,
              {
                width: layout.width,
                height: layout.height,
              },
            ]}
            onPress={() => onImagePress(images, index)}
          >
            <Image
              source={{ uri: image.thumbnail }}
              style={styles.image}
              contentFit="cover"
            />
            {index === maxImages - 1 && remainingCount > 0 && (
              <View style={styles.moreOverlay}>
                <Text style={styles.moreText}>+{remainingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    )
  }

  const renderMomentItem = ({ item }: { item: Moment }) => (
    <Card style={styles.momentCard}>
      <Card.Content>
        <View style={styles.header}>
          <Avatar.Image size={40} source={{ uri: item.userAvatar }} />
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={styles.userName}>
              {item.userName}
            </Text>
            <Text variant="bodySmall" style={styles.timeText}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>

        {item.content ? (
          <Text variant="bodyMedium" style={styles.content}>
            {item.content}
          </Text>
        ) : null}

        {renderImages(item.images)}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(item.id)}
          >
            <IconButton
              icon={item.isLiked ? "heart" : "heart-outline"}
              iconColor={item.isLiked ? "#FF3B30" : "#666"}
              size={20}
            />
            <Text variant="bodySmall" style={styles.actionText}>
              {item.likes}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <IconButton icon="comment-outline" iconColor="#666" size={20} />
            <Text variant="bodySmall" style={styles.actionText}>
              {item.comments}
            </Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <FlatList
      data={moments}
      renderItem={renderMomentItem}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  )
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  momentCard: {
    marginBottom: 16,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
  },
  timeText: {
    color: "#666",
    marginTop: 2,
  },
  content: {
    marginBottom: 12,
    lineHeight: 20,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 12,
  },
  imageWrapper: {
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  moreOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    marginLeft: 4,
    color: "#666",
  },
})
