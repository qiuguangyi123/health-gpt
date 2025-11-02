import { ImagePreview } from "@/components/ImagePreview"
import { MomentList } from "@/components/MomentList"
import { PublishMoment } from "@/components/PublishMoment"
import {
  Moment,
  MomentImage,
  mockGetMoments,
  mockLikeMoment,
  mockPublishMoment,
} from "@/utils/mockApi"
import { useEffect, useState } from "react"
import { StyleSheet, View } from "react-native"
import { FAB, Text, useTheme } from "react-native-paper"

export default function Community() {
  const [moments, setMoments] = useState<Moment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showPublish, setShowPublish] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [previewImages, setPreviewImages] = useState<MomentImage[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  const themeToken = useTheme()

  // 加载朋友圈数据
  const loadMoments = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setIsLoading(true)
      }

      const result = await mockGetMoments(1, 20)
      if (result.success) {
        setMoments(result.data.moments)
      }
    } catch (error) {
      console.error("加载朋友圈失败:", error)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  // 点赞朋友圈
  const handleLike = async (momentId: string) => {
    try {
      const result = await mockLikeMoment(momentId)
      if (result.success) {
        setMoments(prevMoments =>
          prevMoments.map(moment =>
            moment.id === momentId
              ? {
                  ...moment,
                  isLiked: result.data.isLiked || false,
                  likes: result.data.likes || 0,
                }
              : moment
          )
        )
      }
    } catch (error) {
      console.error("点赞失败:", error)
    }
  }

  // 发布朋友圈
  const handlePublish = async (content: string, images: string[]) => {
    try {
      const result = await mockPublishMoment(content, images)
      if (result.success) {
        setMoments(prevMoments => [result.data, ...prevMoments])
      }
    } catch (error) {
      console.error("发布失败:", error)
    }
  }

  // 图片预览
  const handleImagePress = (images: MomentImage[], index: number) => {
    setPreviewImages(images)
    setPreviewIndex(index)
    setShowImagePreview(true)
  }

  // 下拉刷新
  const handleRefresh = () => {
    loadMoments(true)
  }

  useEffect(() => {
    loadMoments()
  }, [])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeToken.colors.background, // 透明背景，让根布局背景色显示
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 18,
      color: "#666",
    },
    fab: {
      position: "absolute",
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: "#007AFF",
    },
  })

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MomentList
        moments={moments}
        onLike={handleLike}
        onImagePress={handleImagePress}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowPublish(true)}
      />

      <PublishMoment
        visible={showPublish}
        onClose={() => setShowPublish(false)}
        onPublish={handlePublish}
      />

      <ImagePreview
        visible={showImagePreview}
        images={previewImages}
        initialIndex={previewIndex}
        onClose={() => setShowImagePreview(false)}
      />
    </View>
  )
}
