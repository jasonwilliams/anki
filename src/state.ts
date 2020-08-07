let _ankiState: any;
let _initialised = false;

export interface IAnkiState {
  api: {
    deckNamesAndIds: { [key: string]: number }[];
  };
}

_ankiState = {};

export const initState = () => {
  _initialised = true;
};

export const getAnkiState = (): IAnkiState => {
  if (!_initialised) {
    throw new Error("Anki State not initialised");
  }

  return _ankiState;
};
