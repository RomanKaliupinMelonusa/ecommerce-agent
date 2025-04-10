'use client';

import { useChat } from '@ai-sdk/react';
import React from 'react'; // Import React
import { ProductCardList } from '@/components/product-card-list'; // Import your component
import { ProductDetails } from '@/components/product-details';  // Import your component

// --- Helper Function for rendering arguments (Keep this) ---
const renderSearchArguments = (args: Record<string, string | number | boolean> | undefined | null) => {
  if (!args) return null;
  const listItems = [];
  // ... (logic to build listItems array remains the same) ...
  if (args.searchQuery) { listItems.push(<li key="searchQuery"><strong>Query:</strong> {args.searchQuery}</li>); }
  if (args.category) { listItems.push(<li key="category"><strong>Category:</strong> {args.category}</li>); }
  if (args.attributes && typeof args.attributes === 'object' && Object.keys(args.attributes).length > 0) {
    listItems.push(<li key="attributes-header" className="font-semibold mt-1">Attributes:</li>);
    for (const [key, value] of Object.entries(args.attributes)) {
      if (value !== undefined && value !== null) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        listItems.push(<li key={`attr-${key}`} className="ml-2">&bull; {formattedKey}: {String(value)}</li>);
      }
    }
  }
  // --- End of listItems logic ---
  if (listItems.length === 0) return null;

  return (
    // Style this block as needed - appears before results
    <div className="my-2 text-sm bg-gray-100 p-3 rounded border border-gray-200 text-gray-700">
      <p className="font-semibold mb-1">Search Criteria Used:</p>
      <ul className="list-none space-y-0.5">
        {listItems}
      </ul>
    </div>
  );
};

export default function Chat() {
  // Make sure API route matches your file structure
  const { messages, input, handleInputChange, handleSubmit, append, status } = useChat({
    api: '/api/chat'
    // You might want to increase maxSteps if tools need multiple calls
    // maxSteps: 10,
  });

  const isLoading = status === 'streaming'; // Check if AI is generating response

  return (
    <div className="flex flex-col w-full max-w-3xl py-12 mx-auto stretch min-h-screen"> {/* Adjusted width and height */}
      <div className="flex-grow space-y-4 px-4 mb-20"> {/* Added padding and bottom margin */}
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`p-3 rounded-lg shadow-sm ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-black'}`}>
              {/* Render role label */}
              <span className="font-semibold block mb-1 capitalize">{message.role}:</span>

              {/* Iterate through message parts */}
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    // Render normal text content
                    return <div key={`${message.id}-text-${i}`} className="whitespace-pre-wrap">{part.text}</div>;

                  case 'tool-invocation':
                    // *** THIS IS WHERE WE HANDLE TOOL INVOCATIONS AND RESULTS ***

                    const toolName = part.toolInvocation.toolName;
                    const toolArgs = part.toolInvocation.args;

                    console.log("Tool Name:", toolName);
                    console.log("Tool Args:", JSON.stringify(toolArgs));


                    // Only render UI when the invocation state is 'result' [cite: 19]
                    if (part.toolInvocation.state === 'result') {
                      const resultData = part.toolInvocation.result; // Access result here [cite: 22]

                      switch (toolName) {
                        case 'searchProducts':
                          // Ensure result is an array before rendering
                          const products = Array.isArray(resultData) ? resultData : [];
                          return (
                            <div key={`${message.id}-search-result-block-${i}`}>
                                {renderSearchArguments(toolArgs)}
                                <ProductCardList products={products} append={append}/>
                            </div>
                          );
                        case 'getProductDetails':
                          // Ensure result is an object before rendering
                          const details = typeof resultData === 'object' && resultData !== null ? resultData : null;
                          // Check if details object is not null and has an id
                          if (details && 'id' in details) {
                            return (
                              <div key={`${message.id}-search-result-block-${i}`}>
                                <ProductDetails details={details} />
                              </div>
                            );
                          } else {
                            // Fallback if details structure is unexpected or null
                            // The AI text should ideally cover "not found" cases.
                            console.warn("Received getProductDetails result but data seems invalid:", resultData);
                            return null;
                            // return <p key={`${message.id}-details-invalid-${i}`} className="text-orange-600 italic my-2 text-sm">Could not display product details from tool result.</p>;
                          }
                        default:
                          // Optionally render raw result for unhandled tools
                          // return (
                          //   <pre key={`${message.id}-tool-res-${i}`} className="text-xs bg-gray-100 p-2 rounded my-1 overflow-x-auto">
                          //     Unhandled Tool Result ({toolName}): {JSON.stringify(resultData, null, 2)}
                          //   </pre>
                          // );
                          return null; // Hide unhandled tool results
                      }
                    } else if (part.toolInvocation.state === 'call') {
                      // Optionally show a "calling tool" indicator when state is 'call'
                      return (
                        <div key={`${message.id}-tool-call-${i}`} className="text-sm text-gray-500 italic my-1">
                          Calling tool: {part.toolInvocation.toolName}...
                        </div>
                      );
                    }
                    // Ignore 'partial-call' state or other states for rendering purposes
                    return null;

                  default:
                    console.warn("Unhandled message part type:", part.type);
                    return null; // Ignore other part types
                }
              })}
            </div>
          </div>
        ))}
        {/* Optional: Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="p-3 rounded-lg shadow-sm bg-gray-100 text-black animate-pulse">
              <span className="font-semibold block mb-1 capitalize">AI:</span>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-10">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto">
          <input
            className="flex-grow px-3 py-2 border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" // Adjusted styling
            value={input}
            placeholder="Ask about laptops or headphones..."
            onChange={handleInputChange}
            required
            disabled={isLoading} // Disable input while processing
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!input.trim() || isLoading} // Disable button while processing or if input is empty
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
