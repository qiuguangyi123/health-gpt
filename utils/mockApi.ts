// 模拟登录API
export const mockLoginApi = async (email: string, password: string) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 模拟登录验证
  if (email === "test" && password === "123456") {
    return {
      success: true,
      data: {
        user: {
          id: "1",
          name: "测试用户",
          email: "test@example.com",
        },
        token: "mock-jwt-token-" + Date.now(),
      },
    }
  } else {
    return {
      success: false,
      error: "邮箱或密码错误",
    }
  }
}

// 模拟验证token
export const mockVerifyToken = async (token: string) => {
  await new Promise(resolve => setTimeout(resolve, 500))

  if (token && token.startsWith("mock-jwt-token-")) {
    return {
      success: true,
      user: {
        id: "1",
        name: "测试用户",
        email: "test@example.com",
      },
    }
  } else {
    return {
      success: false,
      error: "Token无效",
    }
  }
}

// 朋友圈相关接口
export interface MomentImage {
  id: string
  url: string
  thumbnail: string
}

export interface Moment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  images: MomentImage[]
  likes: number
  comments: number
  isLiked: boolean
  createdAt: string
}

// 模拟朋友圈数据
const mockMoments: Moment[] = [
  {
    id: "1",
    userId: "1",
    userName: "张三",
    userAvatar: "https://picsum.photos/100/100?random=1",
    content: "今天天气真好，出去走走！",
    images: [
      {
        id: "1",
        url: "https://picsum.photos/400/300?random=1",
        thumbnail: "https://picsum.photos/200/150?random=1",
      },
      {
        id: "2",
        url: "https://picsum.photos/400/300?random=2",
        thumbnail: "https://picsum.photos/200/150?random=2",
      },
      {
        id: "3",
        url: "https://picsum.photos/400/300?random=3",
        thumbnail: "https://picsum.photos/200/150?random=3",
      },
    ],
    likes: 12,
    comments: 3,
    isLiked: false,
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "2",
    userId: "2",
    userName: "李四",
    userAvatar: "https://picsum.photos/100/100?random=2",
    content: "美食分享，这家餐厅的菜真的不错！",
    images: [
      {
        id: "4",
        url: "https://picsum.photos/400/300?random=4",
        thumbnail: "https://picsum.photos/200/150?random=4",
      },
      {
        id: "5",
        url: "https://picsum.photos/400/300?random=5",
        thumbnail: "https://picsum.photos/200/150?random=5",
      },
    ],
    likes: 8,
    comments: 1,
    isLiked: true,
    createdAt: "2024-01-14T18:20:00Z",
  },
  {
    id: "3",
    userId: "3",
    userName: "王五",
    userAvatar: "https://picsum.photos/100/100?random=3",
    content: "工作之余的放松时光",
    images: [
      {
        id: "6",
        url: "https://picsum.photos/400/300?random=6",
        thumbnail: "https://picsum.photos/200/150?random=6",
      },
      {
        id: "7",
        url: "https://picsum.photos/400/300?random=7",
        thumbnail: "https://picsum.photos/200/150?random=7",
      },
      {
        id: "8",
        url: "https://picsum.photos/400/300?random=8",
        thumbnail: "https://picsum.photos/200/150?random=8",
      },
      {
        id: "9",
        url: "https://picsum.photos/400/300?random=9",
        thumbnail: "https://picsum.photos/200/150?random=9",
      },
    ],
    likes: 15,
    comments: 5,
    isLiked: false,
    createdAt: "2024-01-13T14:15:00Z",
  },
]

// 获取朋友圈列表
export const mockGetMoments = async (page: number = 1, limit: number = 10) => {
  await new Promise(resolve => setTimeout(resolve, 800))

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const moments = mockMoments.slice(startIndex, endIndex)

  return {
    success: true,
    data: {
      moments,
      hasMore: endIndex < mockMoments.length,
      total: mockMoments.length,
    },
  }
}

// 发布朋友圈
export const mockPublishMoment = async (content: string, images: string[]) => {
  await new Promise(resolve => setTimeout(resolve, 1000))

  const newMoment: Moment = {
    id: Date.now().toString(),
    userId: "1",
    userName: "测试用户",
    userAvatar: "https://picsum.photos/100/100?random=current",
    content,
    images: images.map((url, index) => ({
      id: (Date.now() + index).toString(),
      url,
      thumbnail: url,
    })),
    likes: 0,
    comments: 0,
    isLiked: false,
    createdAt: new Date().toISOString(),
  }

  mockMoments.unshift(newMoment)

  return {
    success: true,
    data: newMoment,
  }
}

// 点赞朋友圈
export const mockLikeMoment = async (momentId: string) => {
  await new Promise(resolve => setTimeout(resolve, 300))

  const moment = mockMoments.find(m => m.id === momentId)
  if (moment) {
    if (moment.isLiked) {
      moment.likes -= 1
      moment.isLiked = false
    } else {
      moment.likes += 1
      moment.isLiked = true
    }
  }

  return {
    success: true,
    data: { isLiked: moment?.isLiked, likes: moment?.likes },
  }
}
