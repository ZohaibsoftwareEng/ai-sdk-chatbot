// Dummy tool function for generating random jokes
export interface JokeResult {
  topic: string;
  joke: string;
}

const jokes = {
  programming: [
    "Why do programmers prefer dark mode? Because light attracts bugs!",
    "How many programmers does it take to change a light bulb? None, that's a hardware problem.",
    "Why do Java developers wear glasses? Because they can't C#!",
    "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'",
    "Why don't programmers like nature? It has too many bugs.",
    "There are only 10 types of people in the world: those who understand binary and those who don't.",
    "Why did the programmer quit his job? He didn't get arrays!",
    "What's a programmer's favorite hangout place? Foo Bar!"
  ],
  animals: [
    "Why don't elephants use computers? They're afraid of the mouse!",
    "What do you call a sleeping bull? A bulldozer!",
    "Why don't cats play poker in the savanna? Too many cheetahs!",
    "What do you call a fish wearing a crown? A king fish!",
    "Why don't oysters share? Because they're shellfish!",
    "What do you call a bear with no teeth? A gummy bear!",
    "Why don't elephants ever forget? Because nobody ever tells them anything worth remembering!",
    "What do you call a pig that does karate? A pork chop!"
  ],
  general: [
    "Why don't scientists trust atoms? Because they make up everything!",
    "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    "Why don't eggs tell jokes? They'd crack each other up!",
    "What do you call fake spaghetti? An impasta!",
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "What do you call a factory that makes okay products? A satisfactory!",
    "Why don't skeletons fight each other? They don't have the guts!",
    "What's orange and sounds like a parrot? A carrot!"
  ]
};

/**
 * Dummy tool function that generates random jokes based on a topic.
 * Simulates an API delay and returns a joke object.
 * 
 * @param topic - The topic for the joke ("programming", "animals", or "general")
 * @returns Promise resolving to an object with topic and joke
 */
export async function getRandomJoke(topic: string): Promise<JokeResult> {
  // Simulate API delay (500ms to 2 seconds)
  const delay = Math.random() * 1500 + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Normalize topic to lowercase and handle edge cases
  const normalizedTopic = topic.toLowerCase().trim();
  
  // Default to general if topic is not recognized
  let jokeCategory: keyof typeof jokes;
  if (normalizedTopic in jokes) {
    jokeCategory = normalizedTopic as keyof typeof jokes;
  } else {
    jokeCategory = 'general';
  }

  // Get random joke from the selected category
  const jokesInCategory = jokes[jokeCategory];
  const randomIndex = Math.floor(Math.random() * jokesInCategory.length);
  const selectedJoke = jokesInCategory[randomIndex];

  return {
    topic: jokeCategory,
    joke: selectedJoke
  };
}

/**
 * Get available joke topics
 */
export function getAvailableJokeTopics(): string[] {
  return Object.keys(jokes);
}
