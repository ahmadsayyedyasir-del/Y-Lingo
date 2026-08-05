"""Application-level exception types (domain errors map here in later phases)."""


class YLingoError(Exception):
    """Base exception for Y-Lingo domain and application errors."""

    def __init__(self, message: str, code: str = "YLINGO_ERROR") -> None:
        self.message = message
        self.code = code
        super().__init__(message)