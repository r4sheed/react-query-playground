"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Heart, MessageCircle, Search, Share2, Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react"

interface Post {
  userId: number
  id: number
  title: string
  body: string
}

interface Comment {
  postId: number
  id: number
  name: string
  email: string
  body: string
}

interface PostUser {
  id: number
  name: string
  username: string
  email: string
}

export default function Component() {
  const [posts, setPosts] = useState<Post[]>([])
  const [allPosts, setAllPosts] = useState<Post[]>([]) // Store all posts for search
  const [users, setUsers] = useState<PostUser[]>([])
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>({})
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({ title: "", body: "", userId: 1 })
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const POSTS_PER_PAGE = 20

  // Generate consistent likes based on post ID (deterministic)
  const generateLikes = useCallback((postId: number) => {
    // Use post ID as seed for consistent "random" likes
    const seed = postId * 7 + 13 // Simple hash
    return (seed % 50) + 1 // 1-50 likes
  }, [])

  // Generate consistent comment count based on post ID
  const generateCommentCount = useCallback((postId: number) => {
    const seed = postId * 3 + 7
    return (seed % 15) + 1 // 1-15 comments
  }, [])

  // Memoized search results to prevent unnecessary recalculations
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    return allPosts
      .filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.body.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice(0, 10) // Limit search results
  }, [allPosts, searchQuery])

  // Memoized user lookup
  const userMap = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc[user.id] = user
        return acc
      },
      {} as { [key: number]: PostUser },
    )
  }, [users])

  const getUserById = useCallback(
    (userId: number) => {
      return userMap[userId]
    },
    [userMap],
  )

  // Fetch posts with pagination
  const fetchPosts = async (page = 1, append = false) => {
    try {
      const start = (page - 1) * POSTS_PER_PAGE
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/posts?_start=${start}&_limit=${POSTS_PER_PAGE}`,
      )
      const data = await response.json()

      if (append) {
        setPosts((prev) => [...prev, ...data])
      } else {
        setPosts(data)
      }

      setHasMore(data.length === POSTS_PER_PAGE)
      return data
    } catch (error) {
      toast.error( "Failed to fetch posts")
      return []
    }
  }

  // Fetch all posts for search
  const fetchAllPosts = async () => {
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts")
      const data = await response.json()
      setAllPosts(data)
    } catch (error) {
      toast.error("Failed to fetch all posts for search")
    }
  }

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error( "Failed to fetch users")
    }
  }

  // Load more posts
  const loadMorePosts = async () => {
    if (!hasMore || loadingMore) return

    setLoadingMore(true)
    const nextPage = currentPage + 1
    await fetchPosts(nextPage, true)
    setCurrentPage(nextPage)
    setLoadingMore(false)
  }

  // Fetch comments for a specific post
  const fetchComments = async (postId: number) => {
    if (comments[postId]) return // Don't fetch if already cached

    try {
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`)
      const data = await response.json()
      setComments((prev) => ({ ...prev, [postId]: data }))
    } catch (error) {
      toast.error( "Failed to fetch comments")
    }
  }

  // Create new post
  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.body.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
        method: "POST",
        body: JSON.stringify(newPost),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      })
      const data = await response.json()

      // Add to both posts arrays
      setPosts((prev) => [data, ...prev])
      setAllPosts((prev) => [data, ...prev])

      setNewPost({ title: "", body: "", userId: 1 })
      setIsCreateDialogOpen(false)
      toast.success("Post created successfully")
    } catch (error) {
      toast.error("Failed to create post")
    }
  }

  // Update post
  const updatePost = async (post: Post) => {
    try {
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${post.id}`, {
        method: "PUT",
        body: JSON.stringify(post),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      })
      const data = await response.json()

      // Update both posts arrays
      setPosts((prev) => prev.map((p) => (p.id === post.id ? data : p)))
      setAllPosts((prev) => prev.map((p) => (p.id === post.id ? data : p)))

      setIsEditDialogOpen(false)
      setSelectedPost(null)
      toast.success("Post updated successfully")
    } catch (error) {
      toast.error("Failed to update post")
    }
  }

  // Delete post
  const deletePost = async (postId: number) => {
    try {
      await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`, {
        method: "DELETE",
      })

      // Remove from both posts arrays
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setAllPosts((prev) => prev.filter((p) => p.id !== postId))

      toast.success("Post deleted successfully")
    } catch (error) {
      toast.error("Failed to delete post")
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchPosts(1), fetchUsers(), fetchAllPosts()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleViewPost = useCallback((post: Post) => {
    setSelectedPost(post)
    setIsViewDialogOpen(true)
    setSearchOpen(false)
    fetchComments(post.id)
  }, [])

  const handleEditPost = useCallback((post: Post) => {
    setSelectedPost(post)
    setIsEditDialogOpen(true)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                JSONPlaceholder Posts
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2 bg-transparent"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-4 w-4 xl:mr-2" />
                <span className="hidden xl:inline-flex">Search posts...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 hover:bg-slate-800">
                    <Plus className="h-4 w-4 mr-2" />
                    New Post
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid w-full items-center gap-3">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newPost.title}
                        onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter post title"
                      />
                    </div>
                    <div className="grid w-full items-center gap-3">
                      <Label htmlFor="body">Body</Label>
                      <Textarea
                        id="body"
                        value={newPost.body}
                        onChange={(e) => setNewPost((prev) => ({ ...prev, body: e.target.value }))}
                        placeholder="Enter post content"
                        rows={4}
                      />
                    </div>
                    <Button onClick={createPost} className="w-full">
                      Create Post
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Search Command Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search posts..." onValueChange={handleSearchChange} />
        <CommandList>
          <CommandEmpty>No posts found.</CommandEmpty>
          <CommandGroup heading="Posts">
            {searchResults.map((post) => {
              const user = getUserById(post.userId)
              return (
                <CommandItem
                  key={post.id}
                  onSelect={() => handleViewPost(post)}
                  className="flex flex-col items-start gap-2 px-4 py-3"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Badge variant="secondary" className="text-xs">
                      #{post.id}
                    </Badge>
                    <span className="font-medium truncate flex-1">{post.title}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full text-sm text-muted-foreground">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs">{user?.name || "Unknown User"}</span>
                    <span className="text-xs">•</span>
                    <span className="text-xs truncate">{post.body.slice(0, 60)}...</span>
                  </div>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Latest Posts</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Browse and manage posts from JSONPlaceholder API</p>
          </div>

          {/* Posts Grid */}
          <div className="grid gap-6">
            {posts.map((post) => {
              const user = getUserById(post.userId)
              const likes = generateLikes(post.id)
              const commentCount = generateCommentCount(post.id)

              return (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white border-slate-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        Post #{post.id}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPost(post)}
                          className="text-slate-600 hover:text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPost(post)}
                          className="text-slate-600 hover:text-green-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-slate-600 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the post "
                                {post.title.slice(0, 50)}...".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePost(post.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 hover:text-slate-700 cursor-pointer transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-slate-600 leading-relaxed mb-4 line-clamp-3">{post.body}</p>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-200 text-slate-700 text-sm">
                          {user?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{user?.name || "Unknown User"}</p>
                        <p className="text-xs text-slate-500">@{user?.username || "unknown"}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-red-600">
                          <Heart className="h-4 w-4 mr-1" />
                          {likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-blue-600"
                          onClick={() => handleViewPost(post)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {commentCount}
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-12">
              <Button
                size="lg"
                className="bg-slate-900 hover:bg-slate-800"
                onClick={loadMorePosts}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Posts"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* View Post Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedPost?.title}</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-slate-200 text-slate-700">
                    {getUserById(selectedPost.userId)
                      ?.name.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getUserById(selectedPost.userId)?.name || "Unknown User"}</p>
                  <p className="text-sm text-slate-500">@{getUserById(selectedPost.userId)?.username || "unknown"}</p>
                </div>
              </div>
              <div className="prose max-w-none">
                <p className="text-slate-700 leading-relaxed">{selectedPost.body}</p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Comments</h4>
                {comments[selectedPost.id] ? (
                  <div className="space-y-3">
                    {comments[selectedPost.id].map((comment) => (
                      <div key={comment.id} className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{comment.name}</p>
                          <p className="text-xs text-slate-500">{comment.email}</p>
                        </div>
                        <p className="text-sm text-slate-700">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">Loading comments...</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <div className="grid w-full items-center gap-3">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={selectedPost.title}
                  onChange={(e) => setSelectedPost((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                />
              </div>
              <div className="grid w-full items-center gap-3">
                <Label htmlFor="edit-body">Body</Label>
                <Textarea
                  id="edit-body"
                  value={selectedPost.body}
                  onChange={(e) => setSelectedPost((prev) => (prev ? { ...prev, body: e.target.value } : null))}
                  rows={4}
                />
              </div>
              <Button onClick={() => selectedPost && updatePost(selectedPost)} className="w-full">
                Update Post
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-slate-600">© 2024 JSONPlaceholder Posts. Built with Next.js and shadcn/ui.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
