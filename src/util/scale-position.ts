export function scalePosition(note: string): number {
    return (7 + note.toLowerCase().charCodeAt(0) - 97 - 2) % 7; // 'a' == 97
}
