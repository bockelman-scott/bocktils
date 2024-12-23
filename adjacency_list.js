const obj =
    {
        subscribers:
            [
                {name:"John Doe",address:{street:"Main Street",city:"Lombard",state:"IL",zip:60148}},
                {name:"Jane Doe",address:{street:"Average Avenue",city:"Chicago",state:"IL",zip:60101}}
            ],
        publishers:
            [
                {name:"OReilly", authors:["Sean Carroll"]},
                {name:"Random House", authors:["JK Rowling"]},
            ],
        authors:
            [
                {name:"JK Rowling", books:[{title:"Harry Potter and the Philosopher Stone",publisher:"Random House"},{title:"Harry Potter and the Chamber of Secrets",publisher:"Random House"}]},
                {name:"Sean Carroll", books:[{title:"Something Deeply Hidden",publisher: "OReilly"},{title:"Biggest Ideas in the Universe",publisher: "OReilly"}]}
            ]
    };



const data = obj;

function createAdjacencyList(data) {
    const adjacencyList = {};
    let nextId = 1; // Simple ID generator

    const getId = (type, name) => `${type}-${name}-${nextId++}`; // Unique ID generator

    // Subscribers to Addresses
    data.subscribers.forEach(subscriber => {
        const subscriberId = getId("subscriber", subscriber.name);
        const addressId = getId("address", `${subscriber.address.street}, ${subscriber.address.city}`);

        adjacencyList[subscriberId] = adjacencyList[subscriberId] || [];
        adjacencyList[subscriberId].push(addressId);

        adjacencyList[addressId] = adjacencyList[addressId] || []; // For undirected graph
        adjacencyList[addressId].push(subscriberId);
    });

    // Publishers to Authors
    data.publishers.forEach(publisher => {
        const publisherId = getId("publisher", publisher.name);
        publisher.authors.forEach(authorName => {
            const authorId = getId("author", authorName);
            adjacencyList[publisherId] = adjacencyList[publisherId] || [];
            adjacencyList[publisherId].push(authorId);

            adjacencyList[authorId] = adjacencyList[authorId] || []; // For undirected graph
            adjacencyList[authorId].push(publisherId);
        });
    });

    // Authors to Books
    data.authors.forEach(author => {
        const authorId = getId("author", author.name);
        author.books.forEach(book => {
            const bookId = getId("book", book.title);
            const publisherId = getId("publisher", book.publisher);

            adjacencyList[authorId] = adjacencyList[authorId] || [];
            adjacencyList[authorId].push(bookId);

            adjacencyList[bookId] = adjacencyList[bookId] || [];
            adjacencyList[bookId].push(authorId);

            adjacencyList[bookId] = adjacencyList[bookId] || [];
            adjacencyList[bookId].push(publisherId);

            adjacencyList[publisherId] = adjacencyList[publisherId] || [];
            adjacencyList[publisherId].push(bookId);
        });
    });

    return adjacencyList;
}

const adjList = createAdjacencyList(data);

console.log(JSON.stringify(adjList, null, 2)); // Nicely formatted output