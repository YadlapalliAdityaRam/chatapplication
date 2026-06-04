import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($username: String!, $name: String!, $email: String!, $password: String!) {
    register(username: $username, name: $name, email: $email, password: $password) {
      token
      username
    }
  }
`;

export const LOGIN = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      username
    }
  }
`;

export const CREATE_POST = gql`
  mutation CreatePost($text: String, $image: String, $images: [String]) {
    createPost(text: $text, image: $image, images: $images) {
      id
      author
      authorDetails {
        name
        username
        avatar
      }
      text
      image
      images
      likes
      createdAt
      comments {
        id
        username
        userDetails {
          name
          username
          avatar
        }
        text
        createdAt
      }
    }
  }
`;

export const TOGGLE_LIKE = gql`
  mutation ToggleLike($postId: ID!) {
    toggleLike(postId: $postId) {
      id
      likes
    }
  }
`;

export const ADD_COMMENT = gql`
  mutation AddComment($postId: ID!, $text: String!) {
    addComment(postId: $postId, text: $text) {
      id
      comments {
        id
        username
        userDetails {
          name
          username
          avatar
        }
        text
        createdAt
      }
    }
  }
`;

export const TOGGLE_FOLLOW = gql`
  mutation ToggleFollow($username: String!) {
    toggleFollow(username: $username) {
      user {
        id
        followers
        following
      }
    }
  }
`;

export const MARK_NOTIFICATIONS_READ = gql`
  mutation MarkNotificationsRead {
    markNotificationsRead
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($username: String, $name: String, $bio: String, $avatar: String) {
    updateProfile(username: $username, name: $name, bio: $bio, avatar: $avatar) {
      id
      username
      name
      bio
      avatar
      token
    }
  }
`;

export const SEND_MESSAGE = gql`
  mutation SendMessage($toUsername: String!, $text: String, $media: String) {
    sendMessage(toUsername: $toUsername, text: $text, media: $media) {
      id
      withUser
      blocked
      messages {
        id
        sender
        text
        media
        createdAt
      }
    }
  }
`;

export const BLOCK_USER = gql`
  mutation BlockUser($username: String!, $block: Boolean!) {
    blockUser(username: $username, block: $block) {
      id
      withUser
      blocked
    }
  }
`;

export const DELETE_POST = gql`
  mutation DeletePost($postId: ID!) {
    deletePost(postId: $postId)
  }
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($postId: ID!, $commentId: ID!) {
    deleteComment(postId: $postId, commentId: $commentId) {
      id
      comments {
        id
        username
        userDetails {
          name
          username
          avatar
        }
        text
        createdAt
      }
    }
  }
`;
