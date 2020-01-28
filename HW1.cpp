// Create a Merkel Tree

// Node Structure
struct node{
    int hash;
    struct node *left;
    struct node *right;
}

class MerkelTree{
    public:
        // Constructor
        MerkelTree();
        ~MerkelTree();

        void insert(int hash);
        node *search(int hash);
        void destroy_tree();
        void inorder_print();
        void post_order_print();
        void pre_order_print();

    private:
        void destroy_tree(node *leaf);
        void insert(int hash, node *leaf);
        node *search(int hash, node *leaf);
        void inorder_print(node *leaf);
        void postorder_print(node *leaf);
        void preorder_print(node *leaf);

        node *root;
}

// Constructor
MerkelTree::MerkelTree(){
    root = NULL;
}

// De-constructor??
MerkelTree::~MerkelTree(){
    destroy_tree();
}

void MerkelTree::destroy_tree(node *leaf){
    if(leaf != NULL){
        destroy_tree(leaf->left);
        destroy_tree(leaf->right);
        delete leaf;
    }
}

void MerkelTree::insert(int hash, node *leaf){
    
}


