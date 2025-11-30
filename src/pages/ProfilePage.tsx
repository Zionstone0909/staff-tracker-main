// pages/profile.tsx
import { useMyProfile } from "@/hooks/useMyProfile";

export default function ProfilePage() {
    const { data: user, isLoading, error } = useMyProfile();

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Failed to load profile</p>;

    return (
        <div className="max-w-xl mx-auto p-6 space-y-4">
            <h1 className="text-xl font-bold">My Profile</h1>
            <div className="border p-4 rounded-md shadow-sm bg-white space-y-2">
                <p>
                    <strong>Full Name:</strong> {user.fullName || "-"}
                </p>
                <p>
                    <strong>Username:</strong> {user.username}
                </p>
                <p>
                    <strong>Email:</strong> {user.email}
                </p>
                <p>
                    <strong>Phone:</strong> {user.phone || "-"}
                </p>
                <p>
                    <strong>Address:</strong> {user.address || "-"}
                </p>
                <p>
                    <strong>Bio:</strong> {user.bio || "-"}
                </p>
                <p>
                    <strong>Role:</strong> {user.role}
                </p>
                <p>
                    <strong>Joined:</strong>{" "}
                    {new Date(user.createdAt).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
}
