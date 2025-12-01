// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Poster {
    struct Post {
        uint256 id;
        address user;
        string content;
        string tag;
        uint256 timestamp;
    }

    uint256 private nextId = 1;
    mapping(uint256 => Post) private posts;
    uint256[] private postIds;

    event NewPost(uint256 indexed id, address indexed user, string content, string indexed tag);

    function post(string memory content, string memory tag) public {
        uint256 id = nextId++;

        posts[id] = Post(id, msg.sender, content, tag, block.timestamp);
        postIds.push(id);

        emit NewPost(id, msg.sender, content, tag);
    }

    function updatePost(uint256 id, string memory newContent, string memory newTag) public {
        require(posts[id].user == msg.sender, "Not your post");
        require(posts[id].id != 0, "Post does not exist");

        posts[id].content = newContent;
        posts[id].tag = newTag;
    }

    function deletePost(uint256 id) public {
        require(posts[id].user == msg.sender, "Not your post");
        require(posts[id].id != 0, "Post does not exist");

        delete posts[id];
    }

    function getPost(uint256 id) public view returns (Post memory) {
        require(posts[id].id != 0, "Post does not exist");
        return posts[id];
    }

    function getAllPosts() public view returns (Post[] memory) {
        uint256 count = postIds.length;
        Post[] memory result = new Post[](count);

        for (uint256 i = 0; i < count; i++) {
            uint256 id = postIds[i];
            result[i] = posts[id];
        }

        return result;
    }
}
