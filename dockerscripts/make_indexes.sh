set -ex

export FASTTEXT_PATH="/d/analysis_lessons/006-searh/fastText/fasttext"
export MODEL_PATH="/d/analysis_lessons/006-searh/wiki.ru.bin"

for f in `ls ./.exports/*.tsv` ; do
  echo "${f} loading"
  DN="${f%.tsv}"
  mkdir -p ${DN}

  SORTED_FN="${DN}/$(basename ${f})"
  if [[ ! -f "${SORTED_FN}" ]] ; then
    cat ${f} | head -n 100 | sort  --parallel=8 -u -o "${SORTED_FN}" "${f}"
  fi

  LABELS_FN="${SORTED_FN%.tsv}.labels.txt"
  cat "${SORTED_FN}" | cut -f 1 > "${LABELS_FN}"

  IDS_FN="${SORTED_FN%.tsv}.ids.txt"
  cat "${SORTED_FN}" | cut -f 2 > "${IDS_FN}"

  TENSORS_SSV_FN="${SORTED_FN%.tsv}.tensors.ssv"
  TENSORS_TSV_FN="${SORTED_FN%.tsv}.tensors.tsv"
  if [[ ! -f "${TENSORS_SSV_FN}" ]] ; then
    cat "${LABELS_FN}" | "${FASTTEXT_PATH}" print-sentence-vectors "${MODEL_PATH}"  > "${TENSORS_SSV_FN}"
  fi

  cat "${TENSORS_SSV_FN}" | tr $' ' '\t' > "${TENSORS_TSV_FN}"

  INDEX_FN="${SORTED_FN%.tsv}.anng"
  ngt create -d 300 -D c -i t "${INDEX_FN}" "${TENSORS_SSV_FN}"
done