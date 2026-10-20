
from prompts import TEST_QUESTIONS
from rag_engine import generate_answer


def run_evaluation():
    results = []

    for question in TEST_QUESTIONS:
        for technique in ["zero_shot", "few_shot", "role_based"]:
            result = generate_answer(question, technique)

            results.append({
                "question": question,
                "technique": technique,
                "answer": result["answer"],
                "sources": result["sources"]
            })

    return results


if __name__ == "__main__":
    results = run_evaluation()

    for result in results:
        print("\n" + "=" * 80)
        print("Question:", result["question"])
        print("Technique:", result["technique"])
        print("Answer:", result["answer"])
