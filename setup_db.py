import pymongo
from pymongo.errors import CollectionInvalid, OperationFailure

# MongoDB connection details
MONGODB_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "platinium_lounge"
USERNAME = "elisbrown"
PASSWORD = "AdminPL2025$"

def setup_mongodb():
    """
    Connects to MongoDB, creates the database if it doesn't exist,
    and then creates a user with the specified credentials.
    """
    client = None # Initialize client to None
    try:
        # Establish a connection to MongoDB
        print(f"Attempting to connect to MongoDB at {MONGODB_URI}...")
        client = pymongo.MongoClient(MONGODB_URI)
        client.admin.command('ping') # Check if connection is successful
        print("MongoDB connection successful!")

        # Access the database
        db = client[DATABASE_NAME]
        print(f"Accessing database: {DATABASE_NAME}")

        # Try to create a dummy collection to ensure the database is "created"
        # MongoDB creates the database implicitly on first data insertion.
        # This step ensures the database exists before trying to add a user to it.
        try:
            db.create_collection("dummy_collection")
            print("Dummy collection created to ensure database existence.")
            db.drop_collection("dummy_collection") # Drop the dummy collection
            print("Dummy collection dropped.")
        except CollectionInvalid:
            print("Database already exists (or dummy collection failed to create/drop, which is fine).")
        except Exception as e:
            print(f"An unexpected error occurred with dummy collection: {e}")


        # Check if the user already exists
        users_info = client.admin.command({"usersInfo": 1, "filter": {"user": USERNAME}})
        user_exists = any(u['user'] == USERNAME for u in users_info['users'])

        if user_exists:
            print(f"User '{USERNAME}' already exists. Attempting to update password if needed.")
            # MongoDB doesn't have a direct "update user password" command for non-admin users
            # The 'updateUser' command is typically for roles or custom data.
            # For password change, it's often a delete and re-create, or using 'changeUserPassword'
            # For simplicity and common use case, we'll try to add/update with roles.
            try:
                client.admin.command("updateUser", USERNAME, pwd=PASSWORD, roles=[{"role": "readWrite", "db": DATABASE_NAME}])
                print(f"User '{USERNAME}' updated with new password and roles.")
            except OperationFailure as e:
                print(f"Failed to update user '{USERNAME}': {e}")
                print("You might need to manually drop the user if roles or password changes are complex.")
        else:
            # Create the user with readWrite roles for the specific database
            print(f"Creating user '{USERNAME}' for database '{DATABASE_NAME}'...")
            client.admin.command("createUser", USERNAME, pwd=PASSWORD, roles=[{"role": "readWrite", "db": DATABASE_NAME}])
            print(f"User '{USERNAME}' created successfully with readWrite access to '{DATABASE_NAME}'.")

    except pymongo.errors.ConnectionFailure as e:
        print(f"Could not connect to MongoDB: {e}")
        print("Please ensure your MongoDB Docker container is running and accessible on port 27017.")
    except OperationFailure as e:
        print(f"MongoDB operation failed: {e}")
        print("This might be due to insufficient permissions. Ensure you are connecting as an admin user (if required) or that the 'admin' database allows user creation.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        if client:
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    setup_mongodb()
