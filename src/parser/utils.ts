export function parseLiteralString(s: string): string {
	if (s.startsWith('"""') || s.startsWith("'''")) {
		s = s.slice(3, -3);
	} else {
		s = s.slice(1, -1);
	}
	s = s.replace(/\\n/g, "\n");

	return s.replace(/^\s*(.*?)\s*$/gm, "$1");
}
