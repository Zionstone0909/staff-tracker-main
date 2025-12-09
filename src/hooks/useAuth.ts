// src/hooks/useAuth.ts

/**
 * Barrel export for the useAuth hook.
 * This keeps imports clean across the project:
 * 
 * Instead of:
 *    import { useAuth } from "../contexts/AuthContext";
 * You can use:
 *    import { useAuth } from "../hooks/useAuth";
 */

export { useAuth } from "../contexts/AuthContext";
