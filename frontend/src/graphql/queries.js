import { gql } from '@apollo/client';

export const GET_POSTS = gql`
  query GetPosts {
    getPosts {
      id
      author
      authorDetails {
        name
        username
        avatar
      }
      text
      image
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

export const GET_ME = gql`
  query GetMe {
    getMe {
      id
      username
      name
      bio
      avatar
      followers
      following
      notifications {
        id
        type
        fromUser
        postId
        text
        read
        createdAt
      }
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile($username: String!) {
    getUserProfile(username: $username) {
      user {
        id
        username
        name
        bio
        avatar
        followers
        following
      }
      posts {
        id
        author
        authorDetails {
          name
          username
          avatar
        }
        text
        image
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
  }
`;

export const GET_CONVERSATION = gql`
  query GetConversation($withUser: String!) {
    getConversation(withUser: $withUser) {
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

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      id
      username
      name
      avatar
    }
  }
`;
