import AsyncStorage from "@react-native-async-storage/async-storage"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native"
import { Button, Card, Text, TextInput } from "react-native-paper"

interface TodoItem {
  id: string
  text: string
  completed: boolean
}

export default function Todo() {
  const [todo, setTodo] = useState("")
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载本地存储的数据
  useEffect(() => {
    loadTodos()
  }, [])

  // 保存数据到本地存储
  useEffect(() => {
    if (!isLoading) {
      saveTodos()
    }
  }, [todos, isLoading])

  const loadTodos = async () => {
    try {
      const storedTodos = await AsyncStorage.getItem("todos")
      if (storedTodos) {
        const parsedTodos = JSON.parse(storedTodos)
        console.log(parsedTodos, "parsedTodos")
        setTodos(typeof parsedTodos === "object" ? parsedTodos : [])
      }
    } catch (error) {
      console.error("加载数据失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveTodos = async () => {
    try {
      await AsyncStorage.setItem("todos", JSON.stringify(todos))
    } catch (error) {
      console.error("保存数据失败:", error)
    }
  }

  const addTodo = () => {
    if (todo.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: todo.trim(),
        completed: false,
      }
      setTodos([...todos, newTodo])
      setTodo("")
    }
  }

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const deleteTodo = (id: string) => {
    setTodos(todos?.filter(item => item.id !== id))
  }

  const renderTodoItem = ({ item }: { item: TodoItem }) => (
    <Card style={[styles.todoCard, item.completed && styles.completedCard]}>
      <Card.Content style={styles.todoContent}>
        <TouchableOpacity
          style={styles.todoRow}
          onPress={() => toggleTodo(item.id)}
        >
          <TouchableOpacity
            style={[styles.checkbox, item.completed && styles.checkboxChecked]}
            onPress={() => toggleTodo(item.id)}
          >
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>
          <Text
            style={[styles.todoText, item.completed && styles.completedText]}
          >
            {item.text}
          </Text>
        </TouchableOpacity>
        <Button
          mode="text"
          onPress={() => deleteTodo(item.id)}
          textColor="#FF3B30"
        >
          删除
        </Button>
      </Card.Content>
    </Card>
  )

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#f5f5f5",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 20,
    },
    todoCard: {
      marginBottom: 10,
      elevation: 2,
    },
    completedCard: {
      opacity: 0.7,
      backgroundColor: "#e8f5e8",
    },
    todoContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    todoRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    todoText: {
      fontSize: 16,
      flex: 1,
    },
    completedText: {
      textDecorationLine: "line-through",
      color: "#666",
    },
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      padding: 15,
      backgroundColor: "white",
      borderRadius: 8,
      elevation: 1,
    },
    statsText: {
      fontSize: 14,
      color: "#666",
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: "#007AFF",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    checkboxChecked: {
      backgroundColor: "#007AFF",
    },
    checkmark: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    loadingContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 18,
      color: "#666",
    },
  })

  const completedCount = todos?.filter(todo => todo.completed).length
  const totalCount = todos.length

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>总计: {totalCount}</Text>
        <Text style={styles.statsText}>已完成: {completedCount}</Text>
        <Text style={styles.statsText}>
          未完成: {totalCount - completedCount}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          value={todo}
          onChangeText={setTodo}
          placeholder="输入新的待办事项..."
          style={{ flex: 1 }}
          onSubmitEditing={addTodo}
        />
        <Button mode="contained" onPress={addTodo} disabled={!todo.trim()}>
          添加
        </Button>
      </View>

      <FlatList
        data={todos}
        renderItem={renderTodoItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}
