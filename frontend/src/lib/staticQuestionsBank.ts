export interface MCQQuestion {
  question: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
}

export const staticQuestionsBank: Record<string, MCQQuestion[]> = {
  c: [
    {
      question: "What is the correct syntax to output 'Hello World' in C?",
      options: [
        { id: 'a', text: 'printf("Hello World");' },
        { id: 'b', text: 'print("Hello World");' },
        { id: 'c', text: 'cout << "Hello World";' },
        { id: 'd', text: 'System.out.print("Hello World");' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which header file is required to use printf() and scanf()?",
      options: [
        { id: 'a', text: '<stdlib.h>' },
        { id: 'b', text: '<conio.h>' },
        { id: 'c', text: '<stdio.h>' },
        { id: 'd', text: '<string.h>' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "How do you declare an integer variable in C?",
      options: [
        { id: 'a', text: 'int x;' },
        { id: 'b', text: 'x = int;' },
        { id: 'c', text: 'integer x;' },
        { id: 'd', text: 'let x;' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the size of an int data type on a typical 64-bit GCC compiler?",
      options: [
        { id: 'a', text: '2 bytes' },
        { id: 'b', text: '4 bytes' },
        { id: 'c', text: '8 bytes' },
        { id: 'd', text: 'Depends on the CPU cache' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which format specifier is used for floating-point numbers in printf?",
      options: [
        { id: 'a', text: '%d' },
        { id: 'b', text: '%c' },
        { id: 'c', text: '%s' },
        { id: 'd', text: '%f' }
      ],
      correct_answer: 'd',
      difficulty: 'easy'
    },
    {
      question: "What keyword is used to return a value from a function in C?",
      options: [
        { id: 'a', text: 'back' },
        { id: 'b', text: 'exit' },
        { id: 'c', text: 'return' },
        { id: 'd', text: 'break' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "How do you create a pointer variable pointing to an integer?",
      options: [
        { id: 'a', text: 'int ptr;' },
        { id: 'b', text: 'int *ptr;' },
        { id: 'c', text: 'int &ptr;' },
        { id: 'd', text: 'pointer ptr;' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What operator is used to get the memory address of a variable?",
      options: [
        { id: 'a', text: '*' },
        { id: 'b', text: '&&' },
        { id: 'c', text: '&' },
        { id: 'd', text: '->' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What does the dereference operator '*' do when applied to a pointer variable?",
      options: [
        { id: 'a', text: 'Gets the address of the pointer' },
        { id: 'b', text: 'Multiplies the pointer value' },
        { id: 'c', text: 'Accesses the value stored at the address pointed to' },
        { id: 'd', text: 'Frees the memory of the pointer' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "Which function is used to allocate memory dynamically in C?",
      options: [
        { id: 'a', text: 'alloc()' },
        { id: 'b', text: 'malloc()' },
        { id: 'c', text: 'new()' },
        { id: 'd', text: 'create()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which function is used to free dynamically allocated memory in C?",
      options: [
        { id: 'a', text: 'delete()' },
        { id: 'b', text: 'release()' },
        { id: 'c', text: 'free()' },
        { id: 'd', text: 'clear()' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "How do you declare a constant variable in C?",
      options: [
        { id: 'a', text: 'constant int x = 10;' },
        { id: 'b', text: 'const int x = 10;' },
        { id: 'c', text: 'final int x = 10;' },
        { id: 'd', text: '#const x = 10;' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the default return type of the main() function in ANSI C?",
      options: [
        { id: 'a', text: 'void' },
        { id: 'b', text: 'int' },
        { id: 'c', text: 'char' },
        { id: 'd', text: 'double' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which loop structure guarantees execution of its body at least once?",
      options: [
        { id: 'a', text: 'for loop' },
        { id: 'b', text: 'while loop' },
        { id: 'c', text: 'do-while loop' },
        { id: 'd', text: 'foreach loop' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What value represents false in standard C conditions?",
      options: [
        { id: 'a', text: '0' },
        { id: 'b', text: 'Any negative number' },
        { id: 'c', text: 'NULL only' },
        { id: 'd', text: '1' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the result of 7 / 2 in C integer arithmetic?",
      options: [
        { id: 'a', text: '3.5' },
        { id: 'b', text: '3' },
        { id: 'c', text: '4' },
        { id: 'd', text: '3.0' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which header file provides string manipulation functions like strlen and strcpy?",
      options: [
        { id: 'a', text: '<string.h>' },
        { id: 'b', text: '<str.h>' },
        { id: 'c', text: '<strings.h>' },
        { id: 'd', text: '<stdio.h>' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "How do you find the length of a null-terminated string 'str' in C?",
      options: [
        { id: 'a', text: 'str.length()' },
        { id: 'b', text: 'sizeof(str)' },
        { id: 'c', text: 'strlen(str)' },
        { id: 'd', text: 'length(str)' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What symbol marks the end of a string in C?",
      options: [
        { id: 'a', text: '\\n' },
        { id: 'b', text: '\\0' },
        { id: 'c', text: ';' },
        { id: 'd', text: '.' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What does the 'break' statement do inside a loop?",
      options: [
        { id: 'a', text: 'Pauses the execution of the program' },
        { id: 'b', text: 'Jumps to the next iteration of the loop' },
        { id: 'c', text: 'Terminates the loop and transfers control to the statement following the loop' },
        { id: 'd', text: 'Resets the loop counter' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What keyword is used to define a custom structure in C?",
      options: [
        { id: 'a', text: 'structure' },
        { id: 'b', text: 'struct' },
        { id: 'c', text: 'class' },
        { id: 'd', text: 'type' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which operator is used to access structure members using a structure pointer?",
      options: [
        { id: 'a', text: '.' },
        { id: 'b', text: '->' },
        { id: 'c', text: '*' },
        { id: 'd', text: '&' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is the purpose of the 'typedef' keyword in C?",
      options: [
        { id: 'a', text: 'To create new storage classes' },
        { id: 'b', text: 'To declare a global variable' },
        { id: 'c', text: 'To define an alias name for an existing data type' },
        { id: 'd', text: 'To allocate dynamic memory blocks' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What does the 'continue' statement do inside a loop?",
      options: [
        { id: 'a', text: 'Terminates the entire loop' },
        { id: 'b', text: 'Skips the remaining statements in the current iteration and goes to the next iteration' },
        { id: 'c', text: 'Restarts the loop from the beginning' },
        { id: 'd', text: 'Exits the function containing the loop' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which preprocessor directive is used to include external header files?",
      options: [
        { id: 'a', text: '#import' },
        { id: 'b', text: '#include' },
        { id: 'c', text: '#require' },
        { id: 'd', text: '#use' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What does the 'static' keyword do to a local variable inside a function?",
      options: [
        { id: 'a', text: 'Makes it accessible globally' },
        { id: 'b', text: 'Destroys it immediately after function returns' },
        { id: 'c', text: 'Retains its value between multiple function calls' },
        { id: 'd', text: 'Forces it to be stored in CPU registers' }
      ],
      correct_answer: 'c',
      difficulty: 'hard'
    },
    {
      question: "What is a dangling pointer in C?",
      options: [
        { id: 'a', text: 'A pointer initialized to NULL' },
        { id: 'b', text: 'A pointer pointing to a deallocated memory location' },
        { id: 'c', text: 'A pointer stored inside a struct' },
        { id: 'd', text: 'An uninitialized pointer variable' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "Which function reads a single line of string safely in C11?",
      options: [
        { id: 'a', text: 'gets()' },
        { id: 'b', text: 'scanf()' },
        { id: 'c', text: 'fgets()' },
        { id: 'd', text: 'read()' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What is the output of sizeof(char) in C?",
      options: [
        { id: 'a', text: '1' },
        { id: 'b', text: '2' },
        { id: 'c', text: '4' },
        { id: 'd', text: '8' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which macro is returned by main to indicate successful program execution?",
      options: [
        { id: 'a', text: 'EXIT_SUCCESS' },
        { id: 'b', text: 'STATUS_OK' },
        { id: 'c', text: 'SUCCESS' },
        { id: 'd', text: 'EXEC_DONE' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    }
  ],

  cpp: [
    {
      question: "Which header file is needed for std::cout and std::cin?",
      options: [
        { id: 'a', text: '<stdio.h>' },
        { id: 'b', text: '<iostream>' },
        { id: 'c', text: '<ostream>' },
        { id: 'd', text: '<ios>' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which operator is used for stream insertion (output) in C++?",
      options: [
        { id: 'a', text: '>>' },
        { id: 'b', text: '<<' },
        { id: 'c', text: '<=' },
        { id: 'd', text: '=>' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What feature allows multiple functions with the same name but different parameters?",
      options: [
        { id: 'a', text: 'Function overriding' },
        { id: 'b', text: 'Function overloading' },
        { id: 'c', text: 'Function templates' },
        { id: 'd', text: 'Inheritance' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What keyword is used to inherit a class in C++?",
      options: [
        { id: 'a', text: 'extends' },
        { id: 'b', text: 'implements' },
        { id: 'c', text: ': (Colon)' },
        { id: 'd', text: 'inherits' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What is a virtual function in C++ used for?",
      options: [
        { id: 'a', text: 'To achieve static polymorphism' },
        { id: 'b', text: 'To allow run-time polymorphism (dynamic binding)' },
        { id: 'c', text: 'To speed up class creation' },
        { id: 'd', text: 'To declare a function that has no body' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which keyword is used to handle exceptions in C++?",
      options: [
        { id: 'a', text: 'catch' },
        { id: 'b', text: 'try' },
        { id: 'c', text: 'throw' },
        { id: 'd', text: 'All of the above' }
      ],
      correct_answer: 'd',
      difficulty: 'easy'
    },
    {
      question: "What is the standard STL container for dynamic arrays in C++?",
      options: [
        { id: 'a', text: 'std::array' },
        { id: 'b', text: 'std::list' },
        { id: 'c', text: 'std::vector' },
        { id: 'd', text: 'std::deque' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is the purpose of a destructor in a C++ class?",
      options: [
        { id: 'a', text: 'To allocate memory for the object' },
        { id: 'b', text: 'To clean up resources when the object goes out of scope' },
        { id: 'c', text: 'To copy object parameters' },
        { id: 'd', text: 'To initialize members' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which access specifier makes members accessible within the class and derived classes?",
      options: [
        { id: 'a', text: 'public' },
        { id: 'b', text: 'private' },
        { id: 'c', text: 'protected' },
        { id: 'd', text: 'internal' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What does the 'new' keyword do in C++?",
      options: [
        { id: 'a', text: 'Allocates dynamic memory and calls constructor' },
        { id: 'b', text: 'Allocates static stack memory' },
        { id: 'c', text: 'Creates a memory address reference' },
        { id: 'd', text: 'Declares a variable template' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is the correct way to delete an array allocated with new[]?",
      options: [
        { id: 'a', text: 'delete ptr;' },
        { id: 'b', text: 'delete[] ptr;' },
        { id: 'c', text: 'free(ptr);' },
        { id: 'd', text: 'delete ptr[];' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is a pure virtual function in C++?",
      options: [
        { id: 'a', text: 'A function with no arguments' },
        { id: 'b', text: 'A function declared as virtual void func() = 0;' },
        { id: 'c', text: 'A function that only returns constant values' },
        { id: 'd', text: 'A static virtual method' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which smart pointer in C++11 guarantees single ownership?",
      options: [
        { id: 'a', text: 'std::shared_ptr' },
        { id: 'b', text: 'std::weak_ptr' },
        { id: 'c', text: 'std::unique_ptr' },
        { id: 'd', text: 'std::auto_ptr' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What does std::move do in C++11?",
      options: [
        { id: 'a', text: 'Physically moves memory to a new thread' },
        { id: 'b', text: 'Casts an lvalue to an rvalue reference to enable move semantics' },
        { id: 'c', text: 'Copies elements to another vector' },
        { id: 'd', text: 'Re-allocates dynamic variables' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What keyword defines a template function or class in C++?",
      options: [
        { id: 'a', text: 'template' },
        { id: 'b', text: 'generic' },
        { id: 'c', text: 'typename' },
        { id: 'd', text: 'type' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is RAII in C++ programming?",
      options: [
        { id: 'a', text: 'Resource Allocation Is Intermediate' },
        { id: 'b', text: 'Resource Acquisition Is Initialization' },
        { id: 'c', text: 'Run-time Array Index Instance' },
        { id: 'd', text: 'Run-time Assembly Intermediate Instruction' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "Which STL algorithm sorts elements in a container?",
      options: [
        { id: 'a', text: 'std::order' },
        { id: 'b', text: 'std::arrange' },
        { id: 'c', text: 'std::sort' },
        { id: 'd', text: 'std::filter' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is the time complexity of std::vector access by index?",
      options: [
        { id: 'a', text: 'O(1)' },
        { id: 'b', text: 'O(log n)' },
        { id: 'c', text: 'O(n)' },
        { id: 'd', text: 'O(n log n)' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What keyword prevents a class from being inherited in C++?",
      options: [
        { id: 'a', text: 'const' },
        { id: 'b', text: 'sealed' },
        { id: 'c', text: 'final' },
        { id: 'd', text: 'static' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What is a constructor initializer list used for in C++?",
      options: [
        { id: 'a', text: 'To assign values to member variables before body execution' },
        { id: 'b', text: 'To call virtual functions in parent class' },
        { id: 'c', text: 'To create arrays in heap' },
        { id: 'd', text: 'To call standard template libraries' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What operator is overloaded to customize array indexing in a class?",
      options: [
        { id: 'a', text: 'operator()' },
        { id: 'b', text: 'operator[]' },
        { id: 'c', text: 'operator->' },
        { id: 'd', text: 'operator*' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is the difference between struct and class in C++?",
      options: [
        { id: 'a', text: 'Struct cannot have methods' },
        { id: 'b', text: 'Default access modifier is public in struct, private in class' },
        { id: 'c', text: 'Struct cannot inherit other classes' },
        { id: 'd', text: 'Struct has smaller memory footprints' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which header file contains unique_ptr and shared_ptr?",
      options: [
        { id: 'a', text: '<pointer>' },
        { id: 'b', text: '<memory>' },
        { id: 'c', text: '<utility>' },
        { id: 'd', text: '<algorithm>' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is constexpr in modern C++?",
      options: [
        { id: 'a', text: 'A constant expression evaluated at compile time' },
        { id: 'b', text: 'A variable stored inside CPU registers' },
        { id: 'c', text: 'An external C library pointer declaration' },
        { id: 'd', text: 'A thread-safe global pointer' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "What does std::make_shared do?",
      options: [
        { id: 'a', text: 'Creates multiple instances of same object' },
        { id: 'b', text: 'Allocates control block and object in a single memory block' },
        { id: 'c', text: 'Creates unique pointer reference wrapper' },
        { id: 'd', text: 'Exports class to another namespace' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What is a lambda expression in C++11?",
      options: [
        { id: 'a', text: 'An anonymous nested template class' },
        { id: 'b', text: 'An anonymous inline function object' },
        { id: 'c', text: 'A template parameters list' },
        { id: 'd', text: 'A debugging macro' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which keyword is used to declare auto type deduction in C++11?",
      options: [
        { id: 'a', text: 'var' },
        { id: 'b', text: 'let' },
        { id: 'c', text: 'auto' },
        { id: 'd', text: 'decltype' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is an abstract class in C++?",
      options: [
        { id: 'a', text: 'A class with at least one pure virtual function' },
        { id: 'b', text: 'A class declared as template' },
        { id: 'c', text: 'A class containing only static variables' },
        { id: 'd', text: 'A class with no parent class' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is operator overloading in C++?",
      options: [
        { id: 'a', text: 'Giving custom meaning to operators for user-defined types' },
        { id: 'b', text: 'Using operators inside loops' },
        { id: 'c', text: 'Casting variable types inside a function' },
        { id: 'd', text: 'Creating macros for operators' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What does the explicit keyword prevent on single-argument constructors?",
      options: [
        { id: 'a', text: 'Explicit runtime casting' },
        { id: 'b', text: 'Implicit conversions / assignments' },
        { id: 'c', text: 'Object instantiation in heap' },
        { id: 'd', text: 'Class inheritance override' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    }
  ],

  java: [
    {
      question: "Which keyword is used to define a class in Java?",
      options: [
        { id: 'a', text: 'struct' },
        { id: 'b', text: 'class' },
        { id: 'c', text: 'interface' },
        { id: 'd', text: 'define' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the entry point method signature for a Java application?",
      options: [
        { id: 'a', text: 'public static void main(String[] args)' },
        { id: 'b', text: 'public void main(String args[])' },
        { id: 'c', text: 'static void main()' },
        { id: 'd', text: 'public int main()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which package is automatically imported in every Java program?",
      options: [
        { id: 'a', text: 'java.util.*' },
        { id: 'b', text: 'java.io.*' },
        { id: 'c', text: 'java.lang.*' },
        { id: 'd', text: 'java.net.*' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is the base class of all classes in Java?",
      options: [
        { id: 'a', text: 'Object' },
        { id: 'b', text: 'Class' },
        { id: 'c', text: 'System' },
        { id: 'd', text: 'Base' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which keyword is used to prevent method overriding in Java?",
      options: [
        { id: 'a', text: 'const' },
        { id: 'b', text: 'static' },
        { id: 'c', text: 'final' },
        { id: 'd', text: 'private' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What type of memory does the JVM garbage collector clean?",
      options: [
        { id: 'a', text: 'Stack memory' },
        { id: 'b', text: 'Heap memory' },
        { id: 'c', text: 'Method Area' },
        { id: 'd', text: 'Register memory' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which interface does ArrayList implement in Java?",
      options: [
        { id: 'a', text: 'Map' },
        { id: 'b', text: 'Set' },
        { id: 'c', text: 'List' },
        { id: 'd', text: 'Queue' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is the default value of a boolean instance variable in Java?",
      options: [
        { id: 'a', text: 'true' },
        { id: 'b', text: 'false' },
        { id: 'c', text: 'null' },
        { id: 'd', text: '0' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which keyword is used to declare an interface in Java?",
      options: [
        { id: 'a', text: 'class' },
        { id: 'b', text: 'interface' },
        { id: 'c', text: 'abstract' },
        { id: 'd', text: 'extends' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the difference between String and StringBuilder in Java?",
      options: [
        { id: 'a', text: 'String is mutable, StringBuilder is immutable' },
        { id: 'b', text: 'String is immutable, StringBuilder is mutable' },
        { id: 'c', text: 'String is thread-safe, StringBuilder is slower' },
        { id: 'd', text: 'There is no difference' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which keyword is used to throw an exception explicitly in Java?",
      options: [
        { id: 'a', text: 'throws' },
        { id: 'b', text: 'throw' },
        { id: 'c', text: 'catch' },
        { id: 'd', text: 'try' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is a checked exception in Java?",
      options: [
        { id: 'a', text: 'An exception checked at compile time' },
        { id: 'b', text: 'An exception checked at runtime' },
        { id: 'c', text: 'An exception occurred in JVM' },
        { id: 'd', text: 'A NullPointerException' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which collection implementation stores unique elements with no duplicates?",
      options: [
        { id: 'a', text: 'ArrayList' },
        { id: 'b', text: 'LinkedList' },
        { id: 'c', text: 'HashSet' },
        { id: 'd', text: 'HashMap' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What does the final keyword mean when applied to a variable?",
      options: [
        { id: 'a', text: 'The variable cannot be reassigned' },
        { id: 'b', text: 'The variable has static scope' },
        { id: 'c', text: 'The variable is stored in registers' },
        { id: 'd', text: 'The variable can be accessed anywhere' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the default scope of a class member in Java if no modifier is specified?",
      options: [
        { id: 'a', text: 'public' },
        { id: 'b', text: 'private' },
        { id: 'c', text: 'protected' },
        { id: 'd', text: 'package-private (default)' }
      ],
      correct_answer: 'd',
      difficulty: 'medium'
    },
    {
      question: "Which feature was introduced in Java 8 for functional style operations on collections?",
      options: [
        { id: 'a', text: 'Generics' },
        { id: 'b', text: 'Annotations' },
        { id: 'c', text: 'Streams API' },
        { id: 'd', text: 'Reflection' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What is JVM bytecode?",
      options: [
        { id: 'a', text: 'Source code in Java' },
        { id: 'b', text: 'Machine code specific to CPUs' },
        { id: 'c', text: 'Intermediate representation executed by JVM' },
        { id: 'd', text: 'A compiler output in C' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is the purpose of the try-with-resources statement in Java?",
      options: [
        { id: 'a', text: 'To check array indexes' },
        { id: 'b', text: 'To automatically close AutoCloseable resources' },
        { id: 'c', text: 'To log memory leaks' },
        { id: 'd', text: 'To launch parallel threads' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which keyword is used to implement multiple interfaces in a single class?",
      options: [
        { id: 'a', text: 'extends' },
        { id: 'b', text: 'implements' },
        { id: 'c', text: 'uses' },
        { id: 'd', text: 'imports' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the synchronized keyword used for in Java multi-threading?",
      options: [
        { id: 'a', text: 'To execute methods in parallel' },
        { id: 'b', text: 'To prevent concurrent access to a code block/method by multiple threads' },
        { id: 'c', text: 'To allocate garbage collection priorities' },
        { id: 'd', text: 'To format string variables' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which class is used to read input from console in Java?",
      options: [
        { id: 'a', text: 'Scanner' },
        { id: 'b', text: 'InputReader' },
        { id: 'c', text: 'ConsoleOut' },
        { id: 'd', text: 'BufferReader' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the size of int primitive type in Java?",
      options: [
        { id: 'a', text: '16 bits' },
        { id: 'b', text: '32 bits' },
        { id: 'c', text: '64 bits' },
        { id: 'd', text: 'Varies by OS' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the wrapper class for int in Java?",
      options: [
        { id: 'a', text: 'Int' },
        { id: 'b', text: 'Integer' },
        { id: 'c', text: 'IntWrapper' },
        { id: 'd', text: 'Numeric' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What does System.gc() suggest to the JVM?",
      options: [
        { id: 'a', text: 'Shutdown the program immediately' },
        { id: 'b', text: 'Run the garbage collector' },
        { id: 'c', text: 'Clear class variables' },
        { id: 'd', text: 'Create stack frames' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is an abstract class in Java?",
      options: [
        { id: 'a', text: 'A class that cannot be instantiated' },
        { id: 'b', text: 'A class containing only constants' },
        { id: 'c', text: 'A class declared inside interfaces' },
        { id: 'd', text: 'A static class' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is autoboxing in Java?",
      options: [
        { id: 'a', text: 'Automatic conversion of primitive types to wrapper classes' },
        { id: 'b', text: 'Automatic compile packaging' },
        { id: 'c', text: 'Converting arrays to lists' },
        { id: 'd', text: 'Running processes in sandboxes' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which method of Object class is used for content comparison in Java?",
      options: [
        { id: 'a', text: 'equals()' },
        { id: 'b', text: '==' },
        { id: 'c', text: 'compare()' },
        { id: 'd', text: 'hashCode()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is a marker interface in Java?",
      options: [
        { id: 'a', text: 'An interface with no methods (e.g. Serializable)' },
        { id: 'b', text: 'An interface declaring print methods' },
        { id: 'c', text: 'An interface used for annotations' },
        { id: 'd', text: 'An abstract parent interface' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which JVM area stores loaded class metadata in Java 8+?",
      options: [
        { id: 'a', text: 'PermGen' },
        { id: 'b', text: 'Metaspace' },
        { id: 'c', text: 'Stack Area' },
        { id: 'd', text: 'Heap area' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What does volatile keyword guarantee in Java multi-threading?",
      options: [
        { id: 'a', text: 'Mutual exclusion lock' },
        { id: 'b', text: 'Reads and writes go directly to main memory (visibility)' },
        { id: 'c', text: 'Prevents thread context switches' },
        { id: 'd', text: 'Speeds up class loaders' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    }
  ],

  python: [
    {
      question: "How do you define a function in Python?",
      options: [
        { id: 'a', text: 'def my_func():' },
        { id: 'b', text: 'function my_func()' },
        { id: 'c', text: 'fn my_func()' },
        { id: 'd', text: 'void my_func()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What data structure is created using square brackets [] in Python?",
      options: [
        { id: 'a', text: 'list' },
        { id: 'b', text: 'tuple' },
        { id: 'c', text: 'dict' },
        { id: 'd', text: 'set' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which of the following data types is immutable in Python?",
      options: [
        { id: 'a', text: 'list' },
        { id: 'b', text: 'dict' },
        { id: 'c', text: 'set' },
        { id: 'd', text: 'tuple' }
      ],
      correct_answer: 'd',
      difficulty: 'medium'
    },
    {
      question: "What keyword is used to return value from generator function in Python?",
      options: [
        { id: 'a', text: 'return' },
        { id: 'b', text: 'yield' },
        { id: 'c', text: 'generate' },
        { id: 'd', text: 'send' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "How do you handle exceptions in Python?",
      options: [
        { id: 'a', text: 'try-except' },
        { id: 'b', text: 'try-catch' },
        { id: 'c', text: 'try-throw' },
        { id: 'd', text: 'try-handle' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the result of 3 ** 2 in Python?",
      options: [
        { id: 'a', text: '6' },
        { id: 'b', text: '9' },
        { id: 'c', text: '8' },
        { id: 'd', text: '5' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which built-in function returns the length of a list in Python?",
      options: [
        { id: 'a', text: 'len()' },
        { id: 'b', text: 'length()' },
        { id: 'c', text: 'size()' },
        { id: 'd', text: 'count()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What does list comprehension [x*2 for x in range(3)] produce?",
      options: [
        { id: 'a', text: '[0, 2, 4]' },
        { id: 'b', text: '[2, 4, 6]' },
        { id: 'c', text: '[0, 1, 2]' },
        { id: 'd', text: '[1, 2, 3]' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which keyword is used to import modules in Python?",
      options: [
        { id: 'a', text: 'require' },
        { id: 'b', text: 'include' },
        { id: 'c', text: 'import' },
        { id: 'd', text: 'use' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is the purpose of __init__.py file in Python packages?",
      options: [
        { id: 'a', text: 'To declare unit tests' },
        { id: 'b', text: 'To mark directory as a python package directory' },
        { id: 'c', text: 'To compile variables' },
        { id: 'd', text: 'To launch development server' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is a decorator in Python?",
      options: [
        { id: 'a', text: 'A function that modifies the behavior of another function' },
        { id: 'b', text: 'A variable containing class styles' },
        { id: 'c', text: 'A tool for visual GUI designs' },
        { id: 'd', text: 'A memory management script' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which built-in module is used for regular expressions in Python?",
      options: [
        { id: 'a', text: 'regex' },
        { id: 'b', text: 're' },
        { id: 'c', text: 'regexp' },
        { id: 'd', text: 'str' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is GIL (Global Interpreter Lock) in CPython?",
      options: [
        { id: 'a', text: 'A lock preventing multi-process variables share' },
        { id: 'b', text: 'A mechanism that limits thread execution to one at a time' },
        { id: 'c', text: 'A database index lookup lock' },
        { id: 'd', text: 'A network packet encryption key' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "How do you open a file for reading safely using a context manager?",
      options: [
        { id: 'a', text: 'with open("file.txt", "r") as f:' },
        { id: 'b', text: 'open("file.txt") as f:' },
        { id: 'c', text: 'f = open("file.txt", "r")' },
        { id: 'd', text: 'read open("file.txt")' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the output of type({}) in Python?",
      options: [
        { id: 'a', text: "<class 'set'>" },
        { id: 'b', text: "<class 'dict'>" },
        { id: 'c', text: "<class 'list'>" },
        { id: 'd', text: "<class 'tuple'>" }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which operator is used for floor division in Python?",
      options: [
        { id: 'a', text: '/' },
        { id: 'b', text: '//' },
        { id: 'c', text: '%' },
        { id: 'd', text: '**' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What does 'self' represent inside a Python class method?",
      options: [
        { id: 'a', text: 'The class itself' },
        { id: 'b', text: 'The current instance of the class' },
        { id: 'c', text: 'A global namespace pointer' },
        { id: 'd', text: 'A parent base class' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What keyword is used for anonymous single-line functions in Python?",
      options: [
        { id: 'a', text: 'lambda' },
        { id: 'b', text: 'func' },
        { id: 'c', text: 'anonymous' },
        { id: 'd', text: 'inline' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which built-in function converts an iterable to an iterator?",
      options: [
        { id: 'a', text: 'next()' },
        { id: 'b', text: 'iter()' },
        { id: 'c', text: 'convert()' },
        { id: 'd', text: 'loop()' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What does zip() function do in Python?",
      options: [
        { id: 'a', text: 'Compresses files' },
        { id: 'b', text: 'Merges iterables element-wise into tuples' },
        { id: 'c', text: 'Combines two files into single directory' },
        { id: 'd', text: 'Speeds up execution of lists' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is the difference between 'is' and '==' in Python?",
      options: [
        { id: 'a', text: "'is' checks equality, '==' checks identity" },
        { id: 'b', text: "'is' checks identity (id), '==' checks equality (values)" },
        { id: 'c', text: 'There is no difference' },
        { id: 'd', text: "'is' is only for variables, '==' for objects" }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "How do you slice a list to get elements in reverse order?",
      options: [
        { id: 'a', text: 'lst[::-1]' },
        { id: 'b', text: 'lst.reverse()' },
        { id: 'c', text: 'lst[::0]' },
        { id: 'd', text: 'lst[reverse]' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What do *args and **kwargs allow in function arguments?",
      options: [
        { id: 'a', text: 'Positional arguments only' },
        { id: 'b', text: 'Keyword arguments only' },
        { id: 'c', text: 'Variable number of positional and keyword arguments' },
        { id: 'd', text: 'Only global variable parameters' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "Which method removes and returns the last element of a list?",
      options: [
        { id: 'a', text: 'remove()' },
        { id: 'b', text: 'pop()' },
        { id: 'c', text: 'delete()' },
        { id: 'd', text: 'discard()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is a docstring in Python?",
      options: [
        { id: 'a', text: 'A string literal for documenting code' },
        { id: 'b', text: 'A library for document conversions' },
        { id: 'c', text: 'A variable containing string inputs' },
        { id: 'd', text: 'An external API key' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which function filters elements in a list based on a condition?",
      options: [
        { id: 'a', text: 'filter()' },
        { id: 'b', text: 'map()' },
        { id: 'c', text: 'reduce()' },
        { id: 'd', text: 'select()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What does isinstance(obj, classinfo) do?",
      options: [
        { id: 'a', text: 'Creates instance of obj' },
        { id: 'b', text: 'Checks if obj is an instance or subclass of classinfo' },
        { id: 'c', text: 'Extracts classes names' },
        { id: 'd', text: 'Copies objects parameters' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What built-in operator merges two dicts in Python 3.9+?",
      options: [
        { id: 'a', text: '+' },
        { id: 'b', text: '|' },
        { id: 'c', text: '&' },
        { id: 'd', text: '^' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is virtual environment (venv) used for in Python?",
      options: [
        { id: 'a', text: 'To launch web servers' },
        { id: 'b', text: 'To isolate project dependencies' },
        { id: 'c', text: 'To speed up execution' },
        { id: 'd', text: 'To run virtual databases' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which package manager is default for Python libraries?",
      options: [
        { id: 'a', text: 'npm' },
        { id: 'b', text: 'pip' },
        { id: 'c', text: 'conda' },
        { id: 'd', text: 'gem' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    }
  ],

  sql: [
    {
      question: "Which SQL clause is used to filter records from a SELECT query?",
      options: [
        { id: 'a', text: 'WHERE' },
        { id: 'b', text: 'HAVING' },
        { id: 'c', text: 'GROUP BY' },
        { id: 'd', text: 'FILTER' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which command removes all records from a table without logging individual deletions?",
      options: [
        { id: 'a', text: 'DELETE' },
        { id: 'b', text: 'DROP' },
        { id: 'c', text: 'TRUNCATE' },
        { id: 'd', text: 'REMOVE' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What JOIN returns all matching records from both left and right tables?",
      options: [
        { id: 'a', text: 'INNER JOIN' },
        { id: 'b', text: 'LEFT JOIN' },
        { id: 'c', text: 'RIGHT JOIN' },
        { id: 'd', text: 'FULL OUTER JOIN' }
      ],
      correct_answer: 'd',
      difficulty: 'medium'
    },
    {
      question: "Which aggregate function calculates the total sum of a numeric column?",
      options: [
        { id: 'a', text: 'COUNT()' },
        { id: 'b', text: 'SUM()' },
        { id: 'c', text: 'TOTAL()' },
        { id: 'd', text: 'ADD()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What constraint uniquely identifies each record in a database table?",
      options: [
        { id: 'a', text: 'FOREIGN KEY' },
        { id: 'b', text: 'PRIMARY KEY' },
        { id: 'c', text: 'UNIQUE' },
        { id: 'd', text: 'CHECK' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which SQL statement modifies existing data in a table?",
      options: [
        { id: 'a', text: 'CHANGE' },
        { id: 'b', text: 'MODIFY' },
        { id: 'c', text: 'UPDATE' },
        { id: 'd', text: 'ALTER' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is a Foreign Key constraint used for?",
      options: [
        { id: 'a', text: 'To uniquely identify records' },
        { id: 'b', text: 'To enforce a link between data in two tables' },
        { id: 'c', text: 'To speed up select queries' },
        { id: 'd', text: 'To check null values' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which clause groups rows that have the same values in specified columns?",
      options: [
        { id: 'a', text: 'ORDER BY' },
        { id: 'b', text: 'GROUP BY' },
        { id: 'c', text: 'SORT BY' },
        { id: 'd', text: 'HAVING' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the difference between WHERE and HAVING clause in SQL?",
      options: [
        { id: 'a', text: 'WHERE filters before aggregation, HAVING filters after' },
        { id: 'b', text: 'HAVING filters before aggregation, WHERE filters after' },
        { id: 'c', text: 'There is no difference' },
        { id: 'd', text: 'WHERE is only for update queries' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which keyword orders the result set in descending order?",
      options: [
        { id: 'a', text: 'ASC' },
        { id: 'b', text: 'DESC' },
        { id: 'c', text: 'DOWN' },
        { id: 'd', text: 'REV' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What SQL command is used to create a new database table?",
      options: [
        { id: 'a', text: 'CREATE TABLE' },
        { id: 'b', text: 'NEW TABLE' },
        { id: 'c', text: 'MAKE TABLE' },
        { id: 'd', text: 'ADD TABLE' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which command removes a table definition and all its data permanently?",
      options: [
        { id: 'a', text: 'REMOVE TABLE' },
        { id: 'b', text: 'DELETE TABLE' },
        { id: 'c', text: 'DROP TABLE' },
        { id: 'd', text: 'TRUNCATE TABLE' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is an INDEX used for in a database?",
      options: [
        { id: 'a', text: 'To format rows styling' },
        { id: 'b', text: 'To speed up data retrieval (SELECT queries)' },
        { id: 'c', text: 'To link multiple database instances' },
        { id: 'd', text: 'To backup database files' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What does ACID stand for in database transaction properties?",
      options: [
        { id: 'a', text: 'Atomicity, Consistency, Isolation, Durability' },
        { id: 'b', text: 'Accuracy, Completeness, Integrity, Dependency' },
        { id: 'c', text: 'Analysis, Collection, Indexing, Delivery' },
        { id: 'd', text: 'Automation, Control, Isolation, Distribution' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "Which SQL function counts the number of non-null rows?",
      options: [
        { id: 'a', text: 'SUM()' },
        { id: 'b', text: 'COUNT()' },
        { id: 'c', text: 'TOTAL()' },
        { id: 'd', text: 'ROWS()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is a subquery in SQL?",
      options: [
        { id: 'a', text: 'A query nested inside another query statement' },
        { id: 'b', text: 'A query executed in child database partition' },
        { id: 'c', text: 'A secondary query storage' },
        { id: 'd', text: 'A query running in backgrounds' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which JOIN returns all rows from left table and matched rows from right table?",
      options: [
        { id: 'a', text: 'LEFT JOIN' },
        { id: 'b', text: 'RIGHT JOIN' },
        { id: 'c', text: 'INNER JOIN' },
        { id: 'd', text: 'CROSS JOIN' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What command commits a transaction to make changes permanent?",
      options: [
        { id: 'a', text: 'SAVE' },
        { id: 'b', text: 'COMMIT' },
        { id: 'c', text: 'APPLY' },
        { id: 'd', text: 'EXECUTE' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What statement rolls back a transaction to revert uncommitted changes?",
      options: [
        { id: 'a', text: 'REVERT' },
        { id: 'b', text: 'ROLLBACK' },
        { id: 'c', text: 'UNDO' },
        { id: 'd', text: 'CANCEL' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which operator checks if a column value matches a pattern using wildcards?",
      options: [
        { id: 'a', text: 'MATCH' },
        { id: 'b', text: 'LIKE' },
        { id: 'c', text: 'IN' },
        { id: 'd', text: 'CONTAINS' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What wildcard symbol represents zero or more characters in SQL LIKE operator?",
      options: [
        { id: 'a', text: '_' },
        { id: 'b', text: '%' },
        { id: 'c', text: '*' },
        { id: 'd', text: '?' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What does UNION ALL do compared to UNION in SQL?",
      options: [
        { id: 'a', text: 'UNION ALL includes duplicate rows, UNION removes them' },
        { id: 'b', text: 'UNION ALL removes duplicate rows, UNION includes them' },
        { id: 'c', text: 'UNION ALL is faster because it does not sorting' },
        { id: 'd', text: 'Both A and C' }
      ],
      correct_answer: 'd',
      difficulty: 'medium'
    },
    {
      question: "Which SQL function retrieves the current date and time?",
      options: [
        { id: 'a', text: 'GETDATE() or NOW()' },
        { id: 'b', text: 'TIME()' },
        { id: 'c', text: 'DATE()' },
        { id: 'd', text: 'CURRENT()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is a stored procedure in SQL?",
      options: [
        { id: 'a', text: 'A prepared SQL code segment that you can save and reuse' },
        { id: 'b', text: 'A table storing queries logs' },
        { id: 'c', text: 'A backup file script' },
        { id: 'd', text: 'An external server database connector' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is a database view?",
      options: [
        { id: 'a', text: 'A virtual table based on the result-set of an SQL statement' },
        { id: 'b', text: 'A GUI tool' },
        { id: 'c', text: 'A query compiler' },
        { id: 'd', text: 'A database memory log' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which isolation level prevents dirty reads in ANSI SQL?",
      options: [
        { id: 'a', text: 'READ UNCOMMITTED' },
        { id: 'b', text: 'READ COMMITTED' },
        { id: 'c', text: 'REPEATABLE READ' },
        { id: 'd', text: 'SERIALIZABLE' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What does COALESCE(val1, val2) return?",
      options: [
        { id: 'a', text: 'The sum of both values' },
        { id: 'b', text: 'The first non-null value in the list' },
        { id: 'c', text: 'A concatenated string' },
        { id: 'd', text: 'Null if they are equal' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which SQL command adds a new column to an existing table?",
      options: [
        { id: 'a', text: 'ALTER TABLE ADD' },
        { id: 'b', text: 'UPDATE TABLE ADD' },
        { id: 'c', text: 'CHANGE TABLE COLUMN' },
        { id: 'd', text: 'MODIFY TABLE' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is a NULL value in SQL?",
      options: [
        { id: 'a', text: 'A value of 0' },
        { id: 'b', text: 'An empty space string' },
        { id: 'c', text: 'A marker representing missing or unknown data' },
        { id: 'd', text: 'A syntax error' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What clause limits the number of rows returned in standard PostgreSQL/MySQL?",
      options: [
        { id: 'a', text: 'LIMIT' },
        { id: 'b', text: 'TOP' },
        { id: 'c', text: 'FIRST' },
        { id: 'd', text: 'FETCH ONLY' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    }
  ],

  javascript: [
    {
      question: "Which keyword declares a block-scoped variable that can be reassigned?",
      options: [
        { id: 'a', text: 'var' },
        { id: 'b', text: 'let' },
        { id: 'c', text: 'const' },
        { id: 'd', text: 'static' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the output of typeof null in JavaScript?",
      options: [
        { id: 'a', text: "'null'" },
        { id: 'b', text: "'undefined'" },
        { id: 'c', text: "'object'" },
        { id: 'd', text: "'string'" }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "Which array method creates a new array populated with results of calling a function on every element?",
      options: [
        { id: 'a', text: 'forEach()' },
        { id: 'b', text: 'map()' },
        { id: 'c', text: 'filter()' },
        { id: 'd', text: 'reduce()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is closure in JavaScript?",
      options: [
        { id: 'a', text: 'A function bundled with references to its surrounding state (lexical environment)' },
        { id: 'b', text: 'Closing browser connection' },
        { id: 'c', text: 'Declaring variables inside templates' },
        { id: 'd', text: 'Wrapping files into folders' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which method parses a JSON string into a JavaScript object?",
      options: [
        { id: 'a', text: 'JSON.stringify()' },
        { id: 'b', text: 'JSON.parse()' },
        { id: 'c', text: 'JSON.object()' },
        { id: 'd', text: 'JSON.convert()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What does strict equality operator === check?",
      options: [
        { id: 'a', text: 'Only values equality' },
        { id: 'b', text: 'Both values and types equality' },
        { id: 'c', text: 'Only variables name matches' },
        { id: 'd', text: 'Memory references equality' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What promise state indicates that the operation completed successfully?",
      options: [
        { id: 'a', text: 'pending' },
        { id: 'b', text: 'fulfilled' },
        { id: 'c', text: 'rejected' },
        { id: 'd', text: 'completed' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which keyword is used to pause async function execution until a Promise resolves?",
      options: [
        { id: 'a', text: 'wait' },
        { id: 'b', text: 'pause' },
        { id: 'c', text: 'await' },
        { id: 'd', text: 'async' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is event bubbling in the browser DOM?",
      options: [
        { id: 'a', text: 'Event fires on parent element first, then propagates down to target' },
        { id: 'b', text: 'Event fires on target element first, then propagates up through parents' },
        { id: 'c', text: 'Events run in asynchronous loop' },
        { id: 'd', text: 'Event fires repeatedly' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What does Array.prototype.reduce() do?",
      options: [
        { id: 'a', text: 'Slices the array length' },
        { id: 'b', text: 'Executes a reducer function on each element, resulting in a single output value' },
        { id: 'c', text: 'Filters duplicate items' },
        { id: 'd', text: 'Reverses list elements order' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which keyword creates a constant variable that cannot be reassigned?",
      options: [
        { id: 'a', text: 'const' },
        { id: 'b', text: 'let' },
        { id: 'c', text: 'var' },
        { id: 'd', text: 'constant' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is hoisting in JavaScript?",
      options: [
        { id: 'a', text: 'Compiler moving declarations to the top of their scope before code execution' },
        { id: 'b', text: 'Uploading files to remote servers' },
        { id: 'c', text: 'An alternative to arrow functions syntax' },
        { id: 'd', text: 'A syntax parsing error' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which global method converts a JavaScript object into a JSON string?",
      options: [
        { id: 'a', text: 'JSON.parse()' },
        { id: 'b', text: 'JSON.stringify()' },
        { id: 'c', text: 'JSON.encode()' },
        { id: 'd', text: 'JSON.serialize()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What does the spread operator ... do?",
      options: [
        { id: 'a', text: 'Concatenates strings' },
        { id: 'b', text: 'Expands iterables (like arrays or objects) into individual elements' },
        { id: 'c', text: 'Divides numbers arrays' },
        { id: 'd', text: 'Encrypts JSON payloads' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the output of 1 + '2' in JavaScript?",
      options: [
        { id: 'a', text: "3" },
        { id: 'b', text: "'12'" },
        { id: 'c', text: "NaN" },
        { id: 'd', text: "undefined" }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which array method removes the last element from an array?",
      options: [
        { id: 'a', text: 'shift()' },
        { id: 'b', text: 'pop()' },
        { id: 'c', text: 'push()' },
        { id: 'd', text: 'slice()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the purpose of bind() method on functions?",
      options: [
        { id: 'a', text: 'To call function directly' },
        { id: 'b', text: 'To create a new function with a pre-bound context (this keyword)' },
        { id: 'c', text: 'To validate parameter values' },
        { id: 'd', text: 'To store functions in arrays' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which ES6 feature allows unpacking values from arrays or properties from objects into variables?",
      options: [
        { id: 'a', text: 'Destructuring' },
        { id: 'b', text: 'Spread operator' },
        { id: 'c', text: 'Arrow functions' },
        { id: 'd', text: 'Generators' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is event delegation in JavaScript?",
      options: [
        { id: 'a', text: 'Attaching event listeners to every list item' },
        { id: 'b', text: 'Using a single event listener on a parent element to manage events for all descendants' },
        { id: 'c', text: 'Calling parent components methods' },
        { id: 'd', text: 'Registering background event workers' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What does isNaN('hello') return in JavaScript?",
      options: [
        { id: 'a', text: 'true' },
        { id: 'b', text: 'false' },
        { id: 'c', text: 'NaN' },
        { id: 'd', text: 'null' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which array method checks if at least one element passes a test function?",
      options: [
        { id: 'a', text: 'every()' },
        { id: 'b', text: 'some()' },
        { id: 'c', text: 'find()' },
        { id: 'd', text: 'includes()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the difference between null and undefined?",
      options: [
        { id: 'a', text: 'null is assigned explicitly (empty object reference); undefined means variable is declared but has no value' },
        { id: 'b', text: 'undefined is assigned explicitly; null means undeclared' },
        { id: 'c', text: 'There is no difference' },
        { id: 'd', text: 'null is a string, undefined is a number' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which Web API performs asynchronous HTTP network requests natively in modern JS?",
      options: [
        { id: 'a', text: 'XMLHttpRequest' },
        { id: 'b', text: 'fetch()' },
        { id: 'c', text: 'axios()' },
        { id: 'd', text: 'http.get()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is Map object in ES6?",
      options: [
        { id: 'a', text: 'An array mapper method' },
        { id: 'b', text: 'A collection of key-value pairs where keys can be of any type' },
        { id: 'c', text: 'A visualization tool for maps' },
        { id: 'd', text: 'A class for array indexing' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is Set object in ES6?",
      options: [
        { id: 'a', text: 'A collection of unique values' },
        { id: 'b', text: 'A function for assigning variables' },
        { id: 'c', text: 'A style sheet configuration' },
        { id: 'd', text: 'An asynchronous loop framework' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What does Object.keys(obj) return?",
      options: [
        { id: 'a', text: 'Values array' },
        { id: 'b', text: 'Properties names array' },
        { id: 'c', text: 'Key-value pairs array' },
        { id: 'd', text: 'Map object' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which statement exits a loop immediately in JavaScript?",
      options: [
        { id: 'a', text: 'continue' },
        { id: 'b', text: 'break' },
        { id: 'c', text: 'return' },
        { id: 'd', text: 'exit' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is a Callback function in JavaScript?",
      options: [
        { id: 'a', text: 'A function passed as an argument to another function, to be called later' },
        { id: 'b', text: 'A function that calls itself recursively' },
        { id: 'c', text: 'A global method selector' },
        { id: 'd', text: 'An API key verification script' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which operator provides safe property access on null/undefined objects?",
      options: [
        { id: 'a', text: '??' },
        { id: 'b', text: '?.' },
        { id: 'c', text: '||' },
        { id: 'd', text: '&&' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the Event Loop in the JavaScript runtime?",
      options: [
        { id: 'a', text: 'A graphical animation renderer loop' },
        { id: 'b', text: 'A mechanism that monitors the call stack and callback queue to execute tasks sequentially' },
        { id: 'c', text: 'An array mapping loop' },
        { id: 'd', text: 'A loop compiling TypeScript files' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    }
  ],

  typescript: [
    {
      question: "Which keyword defines a type blueprint for an object structure in TypeScript?",
      options: [
        { id: 'a', text: 'interface' },
        { id: 'b', text: 'struct' },
        { id: 'c', text: 'module' },
        { id: 'd', text: 'class' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the difference between any and unknown in TypeScript?",
      options: [
        { id: 'a', text: 'any allows any operations; unknown enforces type checking before operations' },
        { id: 'b', text: 'unknown allows any operations; any enforces checks' },
        { id: 'c', text: 'There is no difference' },
        { id: 'd', text: 'any is local variable type, unknown is for interfaces' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "How do you declare an array of numbers in TypeScript?",
      options: [
        { id: 'a', text: 'let list: number[];' },
        { id: 'b', text: 'let list: array[number];' },
        { id: 'c', text: 'let list: numbers;' },
        { id: 'd', text: 'let list: List<number>;' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is a tuple type in TypeScript?",
      options: [
        { id: 'a', text: 'An array containing only numbers' },
        { id: 'b', text: 'An array with fixed number of elements whose types are known' },
        { id: 'c', text: 'A readonly class indexer' },
        { id: 'd', text: 'A custom interface alias' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which utility type makes all properties in an interface optional?",
      options: [
        { id: 'a', text: 'Required<T>' },
        { id: 'b', text: 'Partial<T>' },
        { id: 'c', text: 'Readonly<T>' },
        { id: 'd', text: 'Pick<T>' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What does the readonly modifier do on object properties?",
      options: [
        { id: 'a', text: 'Prevents properties from being deleted' },
        { id: 'b', text: 'Prevents properties from being modified after initialization' },
        { id: 'c', text: 'Makes properties private' },
        { id: 'd', text: 'Forces properties to be strings' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is a union type in TypeScript?",
      options: [
        { id: 'a', text: 'A type combining multiple properties definitions' },
        { id: 'b', text: 'A type that can be one of several types (e.g. string | number)' },
        { id: 'c', text: 'A class inheritance structure' },
        { id: 'd', text: 'A compiled database type' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is an intersection type in TypeScript?",
      options: [
        { id: 'a', text: 'A type combining multiple types into one (e.g. TypeA & TypeB)' },
        { id: 'b', text: 'A type checking division values' },
        { id: 'c', text: 'A static class loader' },
        { id: 'd', text: 'A runtime error handler type' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which command compiles TypeScript code to JavaScript using CLI?",
      options: [
        { id: 'a', text: 'tsc' },
        { id: 'b', text: 'node' },
        { id: 'c', text: 'npm run compile' },
        { id: 'd', text: 'ts-node' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What file contains TypeScript compiler configuration options?",
      options: [
        { id: 'a', text: 'package.json' },
        { id: 'b', text: 'tsconfig.json' },
        { id: 'c', text: 'tsconfig.ts' },
        { id: 'd', text: 'webpack.config.js' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is type assertion in TypeScript (using 'as' syntax)?",
      options: [
        { id: 'a', text: 'Casting types at runtime' },
        { id: 'b', text: 'Telling the compiler to treat a value as a specific type' },
        { id: 'c', text: 'Testing code assertions' },
        { id: 'd', text: 'Defining a global class' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which utility type constructs a type with all properties of Type set to required?",
      options: [
        { id: 'a', text: 'Required<T>' },
        { id: 'b', text: 'Partial<T>' },
        { id: 'c', text: 'Pick<T>' },
        { id: 'd', text: 'Record<T>' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is literal type in TypeScript?",
      options: [
        { id: 'a', text: 'A type representing exact value (e.g. status: "success" | "error")' },
        { id: 'b', text: 'A type checking string length' },
        { id: 'c', text: 'An array index selector' },
        { id: 'd', text: 'A custom class constructor' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which utility type selects specific keys from a type?",
      options: [
        { id: 'a', text: 'Omit<T, K>' },
        { id: 'b', text: 'Pick<T, K>' },
        { id: 'c', text: 'Extract<T, U>' },
        { id: 'd', text: 'Exclude<T, U>' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which utility type constructs a type by picking all properties except specified keys?",
      options: [
        { id: 'a', text: 'Pick<T, K>' },
        { id: 'b', text: 'Omit<T, K>' },
        { id: 'c', text: 'Exclude<T, U>' },
        { id: 'd', text: 'Partial<T>' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What does never type represent in TypeScript?",
      options: [
        { id: 'a', text: 'Values that will never occur (e.g. function throwing error)' },
        { id: 'b', text: 'Values of type any' },
        { id: 'c', text: 'A value of null' },
        { id: 'd', text: 'An unassigned class reference' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "What is a generic function or class in TypeScript?",
      options: [
        { id: 'a', text: 'A function that works with a variety of types rather than a single one' },
        { id: 'b', text: 'A class declared in global namespace' },
        { id: 'c', text: 'A template containing only strings' },
        { id: 'd', text: 'A compiler helper script' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "How do you make a parameter optional in a function signature?",
      options: [
        { id: 'a', text: 'Add a question mark (?) after name' },
        { id: 'b', text: 'Add question mark (?) after type' },
        { id: 'c', text: 'Declare it as optional keyword' },
        { id: 'd', text: 'Initialize to null' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is enum type in TypeScript?",
      options: [
        { id: 'a', text: 'A way to define a set of named constants' },
        { id: 'b', text: 'A class wrapper' },
        { id: 'c', text: 'An array indexer' },
        { id: 'd', text: 'A dynamic list constructor' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What does strict: true enable in tsconfig.json?",
      options: [
        { id: 'a', text: 'Enables all strict type-checking options' },
        { id: 'b', text: 'Prevents compilation of files' },
        { id: 'c', text: 'Increases compilation speed' },
        { id: 'd', text: 'Enables ES6 code formatting rules' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is type guard function ('arg is Type') in TypeScript?",
      options: [
        { id: 'a', text: 'A runtime security library' },
        { id: 'b', text: 'A function that returns a boolean to narrow type within a block' },
        { id: 'c', text: 'A class compiling check' },
        { id: 'd', text: 'An interface mapping method' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "Which utility type extracts the return type of a function type?",
      options: [
        { id: 'a', text: 'ReturnType<T>' },
        { id: 'b', text: 'InstanceType<T>' },
        { id: 'c', text: 'Parameters<T>' },
        { id: 'd', text: 'ThisType<T>' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is non-null assertion operator ! in TypeScript?",
      options: [
        { id: 'a', text: 'Negates a boolean' },
        { id: 'b', text: 'Asserts that a value is not null or undefined' },
        { id: 'c', text: 'Casts value to type never' },
        { id: 'd', text: 'Clears object properties' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is an index signature in TypeScript interfaces?",
      options: [
        { id: 'a', text: 'A way to describe the types of properties you don\'t know beforehand' },
        { id: 'b', text: 'A primary key mapping' },
        { id: 'c', text: 'An array sorting function' },
        { id: 'd', text: 'A compilation index catalog' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "What is mapped type in TypeScript?",
      options: [
        { id: 'a', text: 'A type iterating over keys of another type to construct a new type' },
        { id: 'b', text: 'A type checking coordinates' },
        { id: 'c', text: 'An array mapper method' },
        { id: 'd', text: 'A dynamic class interface' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "What is keyof operator in TypeScript?",
      options: [
        { id: 'a', text: 'Gets union type of keys of an object type' },
        { id: 'b', text: 'Gets length of object keys' },
        { id: 'c', text: 'Checks if key exists' },
        { id: 'd', text: 'A security verification key' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is typeof operator in TypeScript type position?",
      options: [
        { id: 'a', text: 'Evaluates type at runtime' },
        { id: 'b', text: 'Extracts the TypeScript type of an existing variable/object' },
        { id: 'c', text: 'Declares class fields' },
        { id: 'd', text: 'Checks if a class extends another' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which utility type constructs an object type whose keys are K and values are T?",
      options: [
        { id: 'a', text: 'Record<K, T>' },
        { id: 'b', text: 'Map<K, T>' },
        { id: 'c', text: 'Pick<K, T>' },
        { id: 'd', text: 'Omit<K, T>' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is conditional type in TypeScript?",
      options: [
        { id: 'a', text: 'A type selected based on condition logic (`T extends U ? X : Y`)' },
        { id: 'b', text: 'A type for handling exception catch blocks' },
        { id: 'c', text: 'A standard if-else loop script' },
        { id: 'd', text: 'An interface declaring methods' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "What does noImplicitAny compiler option do?",
      options: [
        { id: 'a', text: 'Bans any variables definition' },
        { id: 'b', text: 'Raises error on expressions/declarations with an implied any type' },
        { id: 'c', text: 'Forces code auto-compile' },
        { id: 'd', text: 'Checks interface keys types' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    }
  ],

  html_css: [
    {
      question: "Which HTML5 tag is used to embed semantic navigation links?",
      options: [
        { id: 'a', text: '<nav>' },
        { id: 'b', text: '<navigation>' },
        { id: 'c', text: '<links>' },
        { id: 'd', text: '<aside>' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What CSS property is used to change the background color of an element?",
      options: [
        { id: 'a', text: 'color' },
        { id: 'b', text: 'bg-color' },
        { id: 'c', text: 'background-color' },
        { id: 'd', text: 'background-style' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is the CSS Box Model composed of (inner to outer)?",
      options: [
        { id: 'a', text: 'Content, Border, Padding, Margin' },
        { id: 'b', text: 'Content, Padding, Border, Margin' },
        { id: 'c', text: 'Padding, Content, Border, Margin' },
        { id: 'd', text: 'Margin, Border, Padding, Content' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which HTML element is used to define an unordered list?",
      options: [
        { id: 'a', text: '<ol>' },
        { id: 'b', text: '<ul>' },
        { id: 'c', text: '<li>' },
        { id: 'd', text: '<list>' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What CSS property controls layout using 1D flexbox alignment?",
      options: [
        { id: 'a', text: 'display: flex' },
        { id: 'b', text: 'display: grid' },
        { id: 'c', text: 'display: box' },
        { id: 'd', text: 'display: block' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which CSS property controls layout using 2D grid positioning?",
      options: [
        { id: 'a', text: 'display: flex' },
        { id: 'b', text: 'display: grid' },
        { id: 'c', text: 'display: columns' },
        { id: 'd', text: 'display: block' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What does position: absolute do relative to?",
      options: [
        { id: 'a', text: 'The browser window viewport' },
        { id: 'b', text: 'The nearest positioned ancestor element' },
        { id: 'c', text: 'Its original normal flow position' },
        { id: 'd', text: 'The body element only' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which HTML5 tag is used for the primary top header/branding of a page?",
      options: [
        { id: 'a', text: '<header>' },
        { id: 'b', text: '<head>' },
        { id: 'c', text: '<heading>' },
        { id: 'd', text: '<nav>' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which CSS unit is relative to the root element font-size?",
      options: [
        { id: 'a', text: 'em' },
        { id: 'b', text: 'rem' },
        { id: 'c', text: 'px' },
        { id: 'd', text: 'vh' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What HTML attribute provides alternative text for images?",
      options: [
        { id: 'a', text: 'title' },
        { id: 'b', text: 'alt' },
        { id: 'c', text: 'src' },
        { id: 'd', text: 'desc' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which CSS selector targets elements with class name 'card'?",
      options: [
        { id: 'a', text: '#card' },
        { id: 'b', text: '.card' },
        { id: 'c', text: 'card' },
        { id: 'd', text: '*card' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which CSS selector targets an element with a unique id 'submit-btn'?",
      options: [
        { id: 'a', text: '#submit-btn' },
        { id: 'b', text: '.submit-btn' },
        { id: 'c', text: 'submit-btn' },
        { id: 'd', text: '[submit-btn]' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What CSS property specifies the font family of text?",
      options: [
        { id: 'a', text: 'font-style' },
        { id: 'b', text: 'font-family' },
        { id: 'c', text: 'font-type' },
        { id: 'd', text: 'text-font' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which HTML5 input type creates a date picker control?",
      options: [
        { id: 'a', text: 'type="text"' },
        { id: 'b', text: 'type="date"' },
        { id: 'c', text: 'type="time"' },
        { id: 'd', text: 'type="calendar"' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What CSS pseudo-class matches an element when a mouse hovers over it?",
      options: [
        { id: 'a', text: ':hover' },
        { id: 'b', text: ':active' },
        { id: 'c', text: ':focus' },
        { id: 'd', text: ':visited' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What does the z-index property control in CSS?",
      options: [
        { id: 'a', text: 'Element zoom factor' },
        { id: 'b', text: 'Stack order of elements along the z-axis (depth)' },
        { id: 'c', text: 'Horizontal alignment' },
        { id: 'd', text: 'Border width size' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which CSS property transforms text to uppercase or lowercase?",
      options: [
        { id: 'a', text: 'text-transform' },
        { id: 'b', text: 'text-style' },
        { id: 'c', text: 'font-case' },
        { id: 'd', text: 'text-case' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is a media query in CSS used for?",
      options: [
        { id: 'a', text: 'Adding audio/video variables' },
        { id: 'b', text: 'Applying different styles depending on screen sizes / devices characteristics' },
        { id: 'c', text: 'Analyzing database images loading' },
        { id: 'd', text: 'Compiling CSS files' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which HTML element embeds an inline SVG image?",
      options: [
        { id: 'a', text: '<svg>' },
        { id: 'b', text: '<image>' },
        { id: 'c', text: '<embed-svg>' },
        { id: 'd', text: '<iframe>' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What CSS property adds shadow effects around an element's frame?",
      options: [
        { id: 'a', text: 'text-shadow' },
        { id: 'b', text: 'box-shadow' },
        { id: 'c', text: 'frame-shadow' },
        { id: 'd', text: 'shadow-border' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which HTML tag represents main independent self-contained article content?",
      options: [
        { id: 'a', text: '<section>' },
        { id: 'b', text: '<article>' },
        { id: 'c', text: '<aside>' },
        { id: 'd', text: '<div>' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What CSS property creates rounded corners on borders?",
      options: [
        { id: 'a', text: 'border-round' },
        { id: 'b', text: 'border-radius' },
        { id: 'c', text: 'corner-radius' },
        { id: 'd', text: 'border-style' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which HTML tag embeds an external JavaScript file?",
      options: [
        { id: 'a', text: '<js>' },
        { id: 'b', text: '<script>' },
        { id: 'c', text: '<link>' },
        { id: 'd', text: '<code>' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which HTML attribute opens a link target in a new browser tab?",
      options: [
        { id: 'a', text: 'target="_blank"' },
        { id: 'b', text: 'target="_new"' },
        { id: 'c', text: 'target="tab"' },
        { id: 'd', text: 'href="new"' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What CSS property hides an element while keeping its layout space?",
      options: [
        { id: 'a', text: 'display: none' },
        { id: 'b', text: 'visibility: hidden' },
        { id: 'c', text: 'opacity: 0' },
        { id: 'd', text: 'Both B and C' }
      ],
      correct_answer: 'd',
      difficulty: 'medium'
    },
    {
      question: "What does display: none do in CSS?",
      options: [
        { id: 'a', text: 'Hides the element and removes it from document layout flow' },
        { id: 'b', text: 'Keeps layout size space but changes color to transparent' },
        { id: 'c', text: 'Crops images corners' },
        { id: 'd', text: 'Puts layout elements inline' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which CSS property creates smooth transitions between state changes?",
      options: [
        { id: 'a', text: 'animation' },
        { id: 'b', text: 'transition' },
        { id: 'c', text: 'transform' },
        { id: 'd', text: 'delay' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What HTML5 tag embeds video content natively?",
      options: [
        { id: 'a', text: '<media>' },
        { id: 'b', text: '<video>' },
        { id: 'c', text: '<movie>' },
        { id: 'd', text: '<iframe>' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which attribute is required to validate input field completion on form submission?",
      options: [
        { id: 'a', text: 'validate' },
        { id: 'b', text: 'required' },
        { id: 'c', text: 'must-fill' },
        { id: 'd', text: 'checked' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What CSS property truncates text with an ellipsis when overflowing?",
      options: [
        { id: 'a', text: 'text-overflow: ellipsis' },
        { id: 'b', text: 'overflow: hidden' },
        { id: 'c', text: 'white-space: nowrap' },
        { id: 'd', text: 'All of the above combined' }
      ],
      correct_answer: 'd',
      difficulty: 'medium'
    }
  ],

  react: [
    {
      question: "Which Hook manages local state in React functional components?",
      options: [
        { id: 'a', text: 'useState' },
        { id: 'b', text: 'useEffect' },
        { id: 'c', text: 'useContext' },
        { id: 'd', text: 'useReducer' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which Hook handles side effects like fetching data or subscribing to events?",
      options: [
        { id: 'a', text: 'useMemo' },
        { id: 'b', text: 'useEffect' },
        { id: 'c', text: 'useCallback' },
        { id: 'd', text: 'useLayoutEffect' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is JSX in React?",
      options: [
        { id: 'a', text: 'A syntax extension that allows writing HTML-like structures inside JavaScript' },
        { id: 'b', text: 'An XML database module' },
        { id: 'c', text: 'A special file bundling system' },
        { id: 'd', text: 'A state management library' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What attribute must be provided to list items when rendering an array of elements in React?",
      options: [
        { id: 'a', text: 'id' },
        { id: 'b', text: 'key' },
        { id: 'c', text: 'index' },
        { id: 'd', text: 'class' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which Hook returns a memoized value to avoid expensive calculations on re-renders?",
      options: [
        { id: 'a', text: 'useCallback' },
        { id: 'b', text: 'useMemo' },
        { id: 'c', text: 'useRef' },
        { id: 'd', text: 'useReducer' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which Hook returns a memoized callback function?",
      options: [
        { id: 'a', text: 'useMemo' },
        { id: 'b', text: 'useCallback' },
        { id: 'c', text: 'useContext' },
        { id: 'd', text: 'useEffect' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which Hook provides access to React Context values directly?",
      options: [
        { id: 'a', text: 'useContext' },
        { id: 'b', text: 'useContextValue' },
        { id: 'c', text: 'useState' },
        { id: 'd', text: 'useProvider' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which Hook creates a persistent mutable object whose .current property survives re-renders?",
      options: [
        { id: 'a', text: 'useRef' },
        { id: 'b', text: 'useState' },
        { id: 'c', text: 'useMemo' },
        { id: 'd', text: 'useEffect' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the Virtual DOM in React?",
      options: [
        { id: 'a', text: 'A direct database access frame' },
        { id: 'b', text: 'A lightweight in-memory representation of the real DOM' },
        { id: 'c', text: 'An automated testing server' },
        { id: 'd', text: 'A CSS stylesheet generator' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is a functional component in React?",
      options: [
        { id: 'a', text: 'A JavaScript function that accepts props and returns a React element (JSX)' },
        { id: 'b', text: 'A class extending React.Component' },
        { id: 'c', text: 'A special database procedure' },
        { id: 'd', text: 'An external API fetch script' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What function component wrapper prevents unnecessary re-renders if props don't change?",
      options: [
        { id: 'a', text: 'React.memo' },
        { id: 'b', text: 'React.Component' },
        { id: 'c', text: 'React.lazy' },
        { id: 'd', text: 'useMemo' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is React.StrictMode used for in development?",
      options: [
        { id: 'a', text: 'Enforcing security firewalls' },
        { id: 'b', text: 'Identifying potential problems and checking deprecations in components' },
        { id: 'c', text: 'Compiling React to native packages' },
        { id: 'd', text: 'Accelerating component loading speed' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which lifecycle method or hook handles errors caught in child component trees?",
      options: [
        { id: 'a', text: 'componentDidCatch' },
        { id: 'b', text: 'getDerivedStateFromError' },
        { id: 'c', text: 'Error boundary classes' },
        { id: 'd', text: 'All of the above' }
      ],
      correct_answer: 'd',
      difficulty: 'hard'
    },
    {
      question: "What is a controlled component in React form handling?",
      options: [
        { id: 'a', text: 'A component whose value is driven by local state rather than DOM' },
        { id: 'b', text: 'A component managed by external servers' },
        { id: 'c', text: 'A component styled by class selectors' },
        { id: 'd', text: 'An absolute positioned element' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "How do you pass data down from parent component to child component?",
      options: [
        { id: 'a', text: 'Using Context API only' },
        { id: 'b', text: 'Using Props' },
        { id: 'c', text: 'Using State' },
        { id: 'd', text: 'Using local storage' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is prop drilling in React application architecture?",
      options: [
        { id: 'a', text: 'Uploading props variables' },
        { id: 'b', text: 'Passing props through multiple nested child components to reach a deep target' },
        { id: 'c', text: 'Mutating props values' },
        { id: 'd', text: 'Checking types validations' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which Hook handles complex state transitions similar to Redux?",
      options: [
        { id: 'a', text: 'useState' },
        { id: 'b', text: 'useReducer' },
        { id: 'c', text: 'useContext' },
        { id: 'd', text: 'useMemo' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is a React Fragment (<>...</>) used for?",
      options: [
        { id: 'a', text: 'Grouping elements without adding extra nodes to the DOM' },
        { id: 'b', text: 'Creating database fragments' },
        { id: 'c', text: 'Handling exceptions' },
        { id: 'd', text: 'Adding style attributes' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What does useLayoutEffect do compared to useEffect?",
      options: [
        { id: 'a', text: 'Fires synchronously after all DOM mutations but before paint' },
        { id: 'b', text: 'Fires asynchronously after paint' },
        { id: 'c', text: 'Runs inside background web workers' },
        { id: 'd', text: 'Compiles layout styles' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "What is a SyntheticEvent in React?",
      options: [
        { id: 'a', text: 'A fake event generated by tests' },
        { id: 'b', text: 'React\'s cross-browser wrapper around the browser\'s native event' },
        { id: 'c', text: 'A custom event emitter class' },
        { id: 'd', text: 'A keyboard shortcut listener' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which package provides routing capability for React single page applications?",
      options: [
        { id: 'a', text: 'react-router-dom' },
        { id: 'b', text: 'react-router' },
        { id: 'c', text: 'next/router' },
        { id: 'd', text: 'Both A and C are popular' }
      ],
      correct_answer: 'd',
      difficulty: 'easy'
    },
    {
      question: "What is code splitting in React using React.lazy() and Suspense?",
      options: [
        { id: 'a', text: 'Splitting index styles' },
        { id: 'b', text: 'Loading components dynamically only when needed to reduce bundle size' },
        { id: 'c', text: 'Dividing database collections' },
        { id: 'd', text: 'Refactoring variables' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What Hook gets routing parameters in React Router v6?",
      options: [
        { id: 'a', text: 'useParams' },
        { id: 'b', text: 'useSearchParams' },
        { id: 'c', text: 'useNavigate' },
        { id: 'd', text: 'useLocation' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What does setState function do when passed a callback function?",
      options: [
        { id: 'a', text: 'Runs callback before assigning state' },
        { id: 'b', text: 'Ensures state updates run safely using the previous state value' },
        { id: 'c', text: 'Clears state properties' },
        { id: 'd', text: 'Throws an exception catch' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which rule of Hooks states where Hooks can be called in React?",
      options: [
        { id: 'a', text: 'Call Hooks only at the top level of React functions' },
        { id: 'b', text: 'Call Hooks only from React function components or custom Hooks' },
        { id: 'c', text: 'Do not call Hooks inside loops or conditions' },
        { id: 'd', text: 'All of the above' }
      ],
      correct_answer: 'd',
      difficulty: 'medium'
    },
    {
      question: "What is hydration in React server-side rendering (SSR)?",
      options: [
        { id: 'a', text: 'Clearing memory heap logs' },
        { id: 'b', text: 'Attaching event listeners to HTML rendered by the server' },
        { id: 'c', text: 'Converting arrays to lists' },
        { id: 'd', text: 'Refreshing database values' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "Which lifecycle hook was replaced by useEffect in functional components?",
      options: [
        { id: 'a', text: 'componentDidMount' },
        { id: 'b', text: 'componentDidUpdate' },
        { id: 'c', text: 'componentWillUnmount' },
        { id: 'd', text: 'All of the above' }
      ],
      correct_answer: 'd',
      difficulty: 'medium'
    },
    {
      question: "How do you conditionally render an element in React JSX?",
      options: [
        { id: 'a', text: 'Using ternary operator' },
        { id: 'b', text: 'Using logical AND operator (&&)' },
        { id: 'c', text: 'Using helper functions' },
        { id: 'd', text: 'All of the above' }
      ],
      correct_answer: 'd',
      difficulty: 'easy'
    },
    {
      question: "What is the Higher-Order Component (HOC) pattern in React?",
      options: [
        { id: 'a', text: 'A function that takes a component and returns a new enhanced component' },
        { id: 'b', text: 'A component with higher priority rendering' },
        { id: 'c', text: 'A class defining state keys' },
        { id: 'd', text: 'An alternative to custom Hooks' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "Which hook in Next.js 13+ App Router reads URL search parameters?",
      options: [
        { id: 'a', text: 'useSearchParams' },
        { id: 'b', text: 'usePathname' },
        { id: 'c', text: 'useRouter' },
        { id: 'd', text: 'useParams' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    }
  ],

  dsa: [
    {
      question: "What is the average time complexity of searching/lookup in a Hash Table?",
      options: [
        { id: 'a', text: 'O(1)' },
        { id: 'b', text: 'O(log n)' },
        { id: 'c', text: 'O(n)' },
        { id: 'd', text: 'O(n^2)' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which data structure follows the LIFO (Last In First Out) principle?",
      options: [
        { id: 'a', text: 'Queue' },
        { id: 'b', text: 'Stack' },
        { id: 'c', text: 'Binary Tree' },
        { id: 'd', text: 'Linked List' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which data structure follows the FIFO (First In First Out) principle?",
      options: [
        { id: 'a', text: 'Stack' },
        { id: 'b', text: 'Queue' },
        { id: 'c', text: 'Heap' },
        { id: 'd', text: 'Graph' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the worst-case time complexity of the Quick Sort algorithm?",
      options: [
        { id: 'a', text: 'O(n)' },
        { id: 'b', text: 'O(n log n)' },
        { id: 'c', text: 'O(n^2)' },
        { id: 'd', text: 'O(log n)' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What is the worst-case time complexity of the Merge Sort algorithm?",
      options: [
        { id: 'a', text: 'O(n log n)' },
        { id: 'b', text: 'O(n^2)' },
        { id: 'c', text: 'O(log n)' },
        { id: 'd', text: 'O(n)' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which searching algorithm requires a sorted array to operate in O(log n)?",
      options: [
        { id: 'a', text: 'Linear Search' },
        { id: 'b', text: 'Binary Search' },
        { id: 'c', text: 'Depth First Search' },
        { id: 'd', text: 'Breadth First Search' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What data structure is used to implement Breadth First Search (BFS) in a graph?",
      options: [
        { id: 'a', text: 'Stack' },
        { id: 'b', text: 'Queue' },
        { id: 'c', text: 'Heap' },
        { id: 'd', text: 'Binary Search Tree' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What data structure is used to implement Depth First Search (DFS) in a graph?",
      options: [
        { id: 'a', text: 'Queue' },
        { id: 'b', text: 'Stack' },
        { id: 'c', text: 'Priority Queue' },
        { id: 'd', text: 'Hash Map' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is the average time complexity of insertion in a Binary Search Tree (BST)?",
      options: [
        { id: 'a', text: 'O(1)' },
        { id: 'b', text: 'O(log n)' },
        { id: 'c', text: 'O(n)' },
        { id: 'd', text: 'O(n log n)' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which tree data structure is self-balancing to ensure O(log n) performance?",
      options: [
        { id: 'a', text: 'AVL Tree' },
        { id: 'b', text: 'Binary Heap' },
        { id: 'c', text: 'Trie' },
        { id: 'd', text: 'Spanning Tree' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What algorithm finds the shortest path in a weighted graph with non-negative edge weights?",
      options: [
        { id: 'a', text: 'Kruskal\'s Algorithm' },
        { id: 'b', text: 'Prim\'s Algorithm' },
        { id: 'c', text: 'Dijkstra\'s Algorithm' },
        { id: 'd', text: 'Bellman-Ford Algorithm' }
      ],
      correct_answer: 'c',
      difficulty: 'medium'
    },
    {
      question: "What algorithm finds the Minimum Spanning Tree of a graph using greedy edge selection?",
      options: [
        { id: 'a', text: 'Kruskal\'s Algorithm' },
        { id: 'b', text: 'Dijkstra\'s Algorithm' },
        { id: 'c', text: 'Bellman-Ford Algorithm' },
        { id: 'd', text: 'DFS' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What algorithm detects cycles in a linked list using two pointers (fast and slow)?",
      options: [
        { id: 'a', text: 'Floyd\'s Cycle Finding Algorithm (Tortoise and Hare)' },
        { id: 'b', text: 'Kadane\'s Algorithm' },
        { id: 'c', text: 'Kruskal\'s Algorithm' },
        { id: 'd', text: 'Binary Search' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What algorithm matches string patterns using a prefix lookup table?",
      options: [
        { id: 'a', text: 'KMP (Knuth-Morris-Pratt) Algorithm' },
        { id: 'b', text: 'Dijkstra\'s Algorithm' },
        { id: 'c', text: 'Binary Search' },
        { id: 'd', text: 'Rabin-Karp Algorithm' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "What is a Heap data structure primarily used to implement?",
      options: [
        { id: 'a', text: 'Stack' },
        { id: 'b', text: 'Queue' },
        { id: 'c', text: 'Priority Queue' },
        { id: 'd', text: 'Hash Table' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What is the time complexity of building a heap from an array of N elements?",
      options: [
        { id: 'a', text: 'O(n)' },
        { id: 'b', text: 'O(n log n)' },
        { id: 'c', text: 'O(log n)' },
        { id: 'd', text: 'O(n^2)' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "Which data structure is suitable for evaluating arithmetic postfix expressions?",
      options: [
        { id: 'a', text: 'Queue' },
        { id: 'b', text: 'Stack' },
        { id: 'c', text: 'Binary Tree' },
        { id: 'd', text: 'Graph' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the space complexity of recursive Fibonacci implementation without memoization?",
      options: [
        { id: 'a', text: 'O(1)' },
        { id: 'b', text: 'O(n)' },
        { id: 'c', text: 'O(2^n)' },
        { id: 'd', text: 'O(log n)' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What technique stores solved subproblem solutions to avoid redundant computations?",
      options: [
        { id: 'a', text: 'Divide and Conquer' },
        { id: 'b', text: 'Greedy Algorithm' },
        { id: 'c', text: 'Dynamic Programming' },
        { id: 'd', text: 'Backtracking' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What graph representation uses a 2D grid matrix?",
      options: [
        { id: 'a', text: 'Adjacency List' },
        { id: 'b', text: 'Adjacency Matrix' },
        { id: 'c', text: 'Incidence List' },
        { id: 'd', text: 'Disjoint Set' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is topological sort used for in directed acyclic graphs (DAG)?",
      options: [
        { id: 'a', text: 'Finding shortest paths' },
        { id: 'b', text: 'Linear ordering of vertices matching dependency constraints' },
        { id: 'c', text: 'Sorting array elements' },
        { id: 'd', text: 'Minimizing edge weights' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "Which sorting algorithm is stable and has auxiliary worst-case space complexity O(1)?",
      options: [
        { id: 'a', text: 'Quick Sort' },
        { id: 'b', text: 'Merge Sort' },
        { id: 'c', text: 'Insertion Sort' },
        { id: 'd', text: 'Heap Sort' }
      ],
      correct_answer: 'c',
      difficulty: 'hard'
    },
    {
      question: "What is the AVL Tree balance factor range allowed for any node?",
      options: [
        { id: 'a', text: '{-1, 0, 1}' },
        { id: 'b', text: '{-2, 0, 2}' },
        { id: 'c', text: 'any integer value' },
        { id: 'd', text: '{0, 1}' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What task is a Trie (Prefix Tree) data structure best suited for?",
      options: [
        { id: 'a', text: 'Storing floating-point variables' },
        { id: 'b', text: 'Fast string search operations (auto-complete / dictionaries)' },
        { id: 'c', text: 'Sorting integer arrays' },
        { id: 'd', text: 'Balancing matrix dimensions' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is the worst-case time complexity of the Bubble Sort algorithm?",
      options: [
        { id: 'a', text: 'O(n)' },
        { id: 'b', text: 'O(n log n)' },
        { id: 'c', text: 'O(n^2)' },
        { id: 'd', text: 'O(2^n)' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What data structure represents disjoint sets for Kruskal\'s MST algorithm?",
      options: [
        { id: 'a', text: 'Disjoint-Set Union (Union-Find)' },
        { id: 'b', text: 'Heap' },
        { id: 'c', text: 'Stack' },
        { id: 'd', text: 'AVL Tree' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "What is Kadane\'s algorithm used to calculate?",
      options: [
        { id: 'a', text: 'Shortest path in graphs' },
        { id: 'b', text: 'Maximum subarray sum in O(n) time complexity' },
        { id: 'c', text: 'String patterns matches' },
        { id: 'd', text: 'Minimum spanning tree' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is a binary tree where every node has either 0 or 2 children called?",
      options: [
        { id: 'a', text: 'Full Binary Tree' },
        { id: 'b', text: 'Complete Binary Tree' },
        { id: 'c', text: 'Perfect Binary Tree' },
        { id: 'd', text: 'Balanced Binary Tree' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is the height of a balanced binary search tree with N nodes?",
      options: [
        { id: 'a', text: 'O(n)' },
        { id: 'b', text: 'O(log n)' },
        { id: 'c', text: 'O(n^2)' },
        { id: 'd', text: 'O(1)' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is Big-O notation used to measure in computer science?",
      options: [
        { id: 'a', text: 'Code file size footprint' },
        { id: 'b', text: 'Upper bound of runtime execution or space memory growth rate' },
        { id: 'c', text: 'Database rows counts' },
        { id: 'd', text: 'Compilation syntax warning levels' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    }
  ],

  go: [
    {
      question: "Which keyword launches a lightweight concurrent goroutine in Go?",
      options: [
        { id: 'a', text: 'go' },
        { id: 'b', text: 'async' },
        { id: 'c', text: 'spawn' },
        { id: 'd', text: 'thread' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which built-in type handles communication and synchronization between goroutines?",
      options: [
        { id: 'a', text: 'map' },
        { id: 'b', text: 'channel (chan)' },
        { id: 'c', text: 'interface' },
        { id: 'd', text: 'struct' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "How do you declare a variable with type inference in Go short variable syntax?",
      options: [
        { id: 'a', text: 'x = 10' },
        { id: 'b', text: 'var x = 10' },
        { id: 'c', text: 'x := 10' },
        { id: 'd', text: 'let x = 10' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "What keyword defers execution of a function until the surrounding function returns?",
      options: [
        { id: 'a', text: 'defer' },
        { id: 'b', text: 'postpone' },
        { id: 'c', text: 'later' },
        { id: 'd', text: 'delay' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the zero value of an uninitialized int variable in Go?",
      options: [
        { id: 'a', text: '0' },
        { id: 'b', text: 'nil' },
        { id: 'c', text: 'undefined' },
        { id: 'd', text: '-1' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which package provides formatted output functions like Printf and Sprintf in Go?",
      options: [
        { id: 'a', text: 'format' },
        { id: 'b', text: 'fmt' },
        { id: 'c', text: 'io' },
        { id: 'd', text: 'stdio' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What keyword defines a custom struct type in Go?",
      options: [
        { id: 'a', text: 'class' },
        { id: 'b', text: 'type' },
        { id: 'c', text: 'struct' },
        { id: 'd', text: 'interface' }
      ],
      correct_answer: 'c',
      difficulty: 'easy'
    },
    {
      question: "How does Go handle error handling without exception throwing?",
      options: [
        { id: 'a', text: 'By returning error values explicitly as the last return parameter' },
        { id: 'b', text: 'Using try-catch blocks' },
        { id: 'c', text: 'Using panic handlers only' },
        { id: 'd', text: 'Errors are logged automatically' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is a slice in Go compared to an array?",
      options: [
        { id: 'a', text: 'Slices have fixed size, arrays do not' },
        { id: 'b', text: 'Slices are dynamic wrappers on top of arrays' },
        { id: 'c', text: 'Slices only contain strings variables' },
        { id: 'd', text: 'There is no difference' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which keyword defines an interface in Go?",
      options: [
        { id: 'a', text: 'interface' },
        { id: 'b', text: 'type' },
        { id: 'c', text: 'class' },
        { id: 'd', text: 'contract' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the built-in function to allocate and initialize slice, map, or channel?",
      options: [
        { id: 'a', text: 'new()' },
        { id: 'b', text: 'make()' },
        { id: 'c', text: 'alloc()' },
        { id: 'd', text: 'init()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What package provides sync utilities like mutex and waitgroup in Go?",
      options: [
        { id: 'a', text: 'sync' },
        { id: 'b', text: 'concurrency' },
        { id: 'c', text: 'thread' },
        { id: 'd', text: 'mutex' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What does select statement do in Go concurrency?",
      options: [
        { id: 'a', text: 'Selects records from databases' },
        { id: 'b', text: 'Waits on multiple channel operations' },
        { id: 'c', text: 'Chooses execution threads' },
        { id: 'd', text: 'Allocates heap blocks' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "How do you declare a constant in Go?",
      options: [
        { id: 'a', text: 'const x = 10' },
        { id: 'b', text: 'constant x = 10' },
        { id: 'c', text: 'final x = 10' },
        { id: 'd', text: 'let const x = 10' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the panic and recover mechanism in Go?",
      options: [
        { id: 'a', text: 'A syntax compiler diagnostic' },
        { id: 'b', text: 'A way to handle runtime panics and restore execution flow' },
        { id: 'c', text: 'A garbage collection optimizer' },
        { id: 'd', text: 'A type assertions check' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What is the entry point function name of any runnable Go program?",
      options: [
        { id: 'a', text: 'main()' },
        { id: 'b', text: 'start()' },
        { id: 'c', text: 'init()' },
        { id: 'd', text: 'run()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which command compiles and runs a Go program directly?",
      options: [
        { id: 'a', text: 'go build' },
        { id: 'b', text: 'go run' },
        { id: 'c', text: 'go compile' },
        { id: 'd', text: 'go execute' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What system manages external package dependencies in modern Go?",
      options: [
        { id: 'a', text: 'Go modules (go.mod)' },
        { id: 'b', text: 'npm' },
        { id: 'c', text: 'glide' },
        { id: 'd', text: 'dep' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the zero value of a pointer or interface in Go?",
      options: [
        { id: 'a', text: 'nil' },
        { id: 'b', text: '0' },
        { id: 'c', text: 'null' },
        { id: 'd', text: 'undefined' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What operator dereferences a pointer variable in Go?",
      options: [
        { id: 'a', text: '*' },
        { id: 'b', text: '&' },
        { id: 'c', text: '->' },
        { id: 'd', text: '.' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "How do you check if a key exists in a Go map?",
      options: [
        { id: 'a', text: 'value, ok := myMap[key]' },
        { id: 'b', text: 'ok := myMap.has(key)' },
        { id: 'c', text: 'value := myMap[key]' },
        { id: 'd', text: 'if myMap[key] != nil' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What built-in function appends elements to a slice?",
      options: [
        { id: 'a', text: 'add()' },
        { id: 'b', text: 'append()' },
        { id: 'c', text: 'push()' },
        { id: 'd', text: 'insert()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is a receiver function in Go implementation?",
      options: [
        { id: 'a', text: 'A method associated with a specific struct or type' },
        { id: 'b', text: 'A channel reader routine' },
        { id: 'c', text: 'An exception capture method' },
        { id: 'd', text: 'A JSON parsing script' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which keyword controls export capability outside package in Go?",
      options: [
        { id: 'a', text: 'Capitalization of the identifier name' },
        { id: 'b', text: 'export keyword' },
        { id: 'c', text: 'public keyword' },
        { id: 'd', text: 'package keyword' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is empty interface interface{} or any in Go?",
      options: [
        { id: 'a', text: 'An interface that can hold values of any type' },
        { id: 'b', text: 'An interface with syntax errors' },
        { id: 'c', text: 'A null pointer placeholder' },
        { id: 'd', text: 'A compiler warnings bypass' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What command formats Go code according to standard conventions?",
      options: [
        { id: 'a', text: 'go clean' },
        { id: 'b', text: 'go fmt' },
        { id: 'c', text: 'go lint' },
        { id: 'd', text: 'go Vet' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which built-in function returns the length of a slice or map?",
      options: [
        { id: 'a', text: 'len()' },
        { id: 'b', text: 'length()' },
        { id: 'c', text: 'size()' },
        { id: 'd', text: 'count()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What garbage collector type is used in the Go runtime?",
      options: [
        { id: 'a', text: 'Reference counting GC' },
        { id: 'b', text: 'Concurrent, tri-color, mark-and-sweep collector' },
        { id: 'c', text: 'Generational GC' },
        { id: 'd', text: 'Manual memory sweeps only' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What package handles JSON parsing and serialization in Go?",
      options: [
        { id: 'a', text: 'encoding/json' },
        { id: 'b', text: 'json' },
        { id: 'c', text: 'text/json' },
        { id: 'd', text: 'parse/json' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is go test command used for?",
      options: [
        { id: 'a', text: 'To launch testing files matching *_test.go' },
        { id: 'b', text: 'To compile binary files' },
        { id: 'c', text: 'To check syntax types warnings' },
        { id: 'd', text: 'To run benchmark servers' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    }
  ],

  rust: [
    {
      question: "What fundamental memory management concept does Rust enforce at compile-time without GC?",
      options: [
        { id: 'a', text: 'Ownership and Borrowing' },
        { id: 'b', text: 'Garbage Collection' },
        { id: 'c', text: 'Reference Counting' },
        { id: 'd', text: 'Manual malloc/free' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which keyword declares an immutable variable by default in Rust?",
      options: [
        { id: 'a', text: 'var' },
        { id: 'b', text: 'let' },
        { id: 'c', text: 'const' },
        { id: 'd', text: 'static' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which keyword makes a variable mutable in Rust?",
      options: [
        { id: 'a', text: 'mut' },
        { id: 'b', text: 'let mut' },
        { id: 'c', text: 'var' },
        { id: 'd', text: 'changeable' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which Rust type represents either a successful value or an error?",
      options: [
        { id: 'a', text: 'Option' },
        { id: 'b', text: 'Result<T, E>' },
        { id: 'c', text: 'Either' },
        { id: 'd', text: 'Try' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which Rust type represents either a value or nothing?",
      options: [
        { id: 'a', text: 'Option<T>' },
        { id: 'b', text: 'Result' },
        { id: 'c', text: 'None' },
        { id: 'd', text: 'Nullable' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What operator is used to unwrap or propagate errors easily in Rust expressions?",
      options: [
        { id: 'a', text: '?' },
        { id: 'b', text: '!' },
        { id: 'c', text: '*' },
        { id: 'd', text: '&' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What does &mut reference represent in Rust borrowing rules?",
      options: [
        { id: 'a', text: 'A mutable borrow (only one active mutable reference allowed at a time)' },
        { id: 'b', text: 'An immutable reference copy' },
        { id: 'c', text: 'A heap address allocation' },
        { id: 'd', text: 'A reference matching static lifetimes' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is a lifetime parameter in Rust generic functions?",
      options: [
        { id: 'a', text: 'A declaration checking how long references remain valid' },
        { id: 'b', text: 'A thread timeout interval' },
        { id: 'c', text: 'A memory size footprint check' },
        { id: 'd', text: 'A loop counter variable' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "Which macro prints formatted text to stdout with a newline?",
      options: [
        { id: 'a', text: 'print!()' },
        { id: 'b', text: 'println!()' },
        { id: 'c', text: 'format!()' },
        { id: 'd', text: 'write!()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is Cargo in the Rust ecosystem?",
      options: [
        { id: 'a', text: 'Rust build system and package manager' },
        { id: 'b', text: 'A standard layout library' },
        { id: 'c', text: 'A database query parser' },
        { id: 'd', text: 'A code formatter tool' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which keyword defines a custom struct in Rust?",
      options: [
        { id: 'a', text: 'struct' },
        { id: 'b', text: 'type' },
        { id: 'c', text: 'class' },
        { id: 'd', text: 'interface' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which keyword defines an enumeration with associated data in Rust?",
      options: [
        { id: 'a', text: 'enum' },
        { id: 'b', text: 'struct' },
        { id: 'c', text: 'union' },
        { id: 'd', text: 'list' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the pattern matching construct in Rust using 'match'?",
      options: [
        { id: 'a', text: 'A way to branch execution flow based on patterns matches' },
        { id: 'b', text: 'A string substring search method' },
        { id: 'c', text: 'A compiler diagnostic script' },
        { id: 'd', text: 'An array index selector' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which keyword implements methods or traits for a struct in Rust?",
      options: [
        { id: 'a', text: 'impl' },
        { id: 'b', text: 'fn' },
        { id: 'c', text: 'trait' },
        { id: 'd', text: 'using' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is a trait in Rust compared to interfaces in other languages?",
      options: [
        { id: 'a', text: 'A definition of shared behavior that types can implement' },
        { id: 'b', text: 'A class variable template' },
        { id: 'c', text: 'A compiler assembly optimizer' },
        { id: 'd', text: 'A type assertion guard' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What smart pointer provides heap allocation with single ownership in Rust?",
      options: [
        { id: 'a', text: 'Box<T>' },
        { id: 'b', text: 'Rc<T>' },
        { id: 'c', text: 'Arc<T>' },
        { id: 'd', text: 'RefCell<T>' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What smart pointer provides reference counting shared ownership in Rust?",
      options: [
        { id: 'a', text: 'Box<T>' },
        { id: 'b', text: 'Rc<T>' },
        { id: 'c', text: 'Unique<T>' },
        { id: 'd', text: 'Mutex<T>' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What does an unsafe block permit in Rust code?",
      options: [
        { id: 'a', text: 'Bypassing borrow checker, dereferencing raw pointers, calling unsafe functions' },
        { id: 'b', text: 'Disabling compiler checks completely' },
        { id: 'c', text: 'Running processes in parent shells' },
        { id: 'd', text: 'Speeding up compilation builds' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "What is closure syntax in Rust?",
      options: [
        { id: 'a', text: '|args| { body }' },
        { id: 'b', text: 'fn(args) -> body' },
        { id: 'c', text: 'lambda args: body' },
        { id: 'd', text: 'args => body' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which macro panics the current thread with an error message in Rust?",
      options: [
        { id: 'a', text: 'panic!()' },
        { id: 'b', text: 'throw!()' },
        { id: 'c', text: 'assert!()' },
        { id: 'd', text: 'exit!()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the RAII drop trait in Rust memory safety?",
      options: [
        { id: 'a', text: 'Runs custom code when variable goes out of scope to release resources' },
        { id: 'b', text: 'Crashes program on heap leaks' },
        { id: 'c', text: 'Splits arrays elements' },
        { id: 'd', text: 'Converts floats to ints' }
      ],
      correct_answer: 'a',
      difficulty: 'hard'
    },
    {
      question: "How do you slice a vector or string in Rust?",
      options: [
        { id: 'a', text: '&data[start..end]' },
        { id: 'b', text: 'data[start, end]' },
        { id: 'c', text: 'data.slice(start, end)' },
        { id: 'd', text: 'data[start:end]' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What is the difference between String and &str in Rust?",
      options: [
        { id: 'a', text: 'String is owned heap string; &str is a borrowed string slice reference' },
        { id: 'b', text: '&str is owned heap string; String is reference' },
        { id: 'c', text: 'There is no difference' },
        { id: 'd', text: 'String is mutable list, &str is constant char' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What does #[derive(Debug)] attribute do?",
      options: [
        { id: 'a', text: 'Bypasses compile diagnostics' },
        { id: 'b', text: 'Automatically generates format printer capability for debugging prints' },
        { id: 'c', text: 'Runs code in debug shell profile' },
        { id: 'd', text: 'Enables thread locks' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What compiler checks borrow checker rules in Rust?",
      options: [
        { id: 'a', text: 'rustc compiler' },
        { id: 'b', text: 'cargo runner' },
        { id: 'c', text: 'rustfmt' },
        { id: 'd', text: 'rust-analyzer' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which tool lints Rust code for idiom compliance?",
      options: [
        { id: 'a', text: 'rustfmt' },
        { id: 'b', text: 'cargo clippy' },
        { id: 'c', text: 'cargo check' },
        { id: 'd', text: 'cargo clean' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What command compiles and builds a Rust package using Cargo?",
      options: [
        { id: 'a', text: 'cargo build' },
        { id: 'b', text: 'cargo run' },
        { id: 'c', text: 'cargo compile' },
        { id: 'd', text: 'cargo new' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What provides async/await runtime support in Rust ecosystem?",
      options: [
        { id: 'a', text: 'Standard library (std)' },
        { id: 'b', text: 'Tokio or async-std third-party crates' },
        { id: 'c', text: 'Cargo compiler itself' },
        { id: 'd', text: 'None of the above' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What is zero-cost abstractions principle in Rust design?",
      options: [
        { id: 'a', text: 'Free software licenses checks' },
        { id: 'b', text: 'What you don\'t use, you don\'t pay for; abstractions compile down to code as efficient as manual assembly' },
        { id: 'c', text: 'Writing code without using variables' },
        { id: 'd', text: 'No memory footprint growth' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What is primary module entry file in Rust package library?",
      options: [
        { id: 'a', text: 'lib.rs' },
        { id: 'b', text: 'main.rs' },
        { id: 'c', text: 'mod.rs' },
        { id: 'd', text: 'package.rs' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    }
  ],

  php: [
    {
      question: "What character prefix must all variables begin with in PHP?",
      options: [
        { id: 'a', text: '$ (Dollar sign)' },
        { id: 'b', text: '@ (At symbol)' },
        { id: 'c', text: '# (Hash symbol)' },
        { id: 'd', text: '& (Ampersand)' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which superglobal array contains form data sent via HTTP POST method?",
      options: [
        { id: 'a', text: '$_GET' },
        { id: 'b', text: '$_POST' },
        { id: 'c', text: '$_REQUEST' },
        { id: 'd', text: '$_SESSION' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which superglobal array contains query parameter string values sent via HTTP GET?",
      options: [
        { id: 'a', text: '$_GET' },
        { id: 'b', text: '$_POST' },
        { id: 'c', text: '$_PARAMS' },
        { id: 'd', text: '$_QUERY' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which function includes an external PHP file and halts execution if the file is missing?",
      options: [
        { id: 'a', text: 'include()' },
        { id: 'b', text: 'require()' },
        { id: 'c', text: 'load()' },
        { id: 'd', text: 'import()' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "Which function outputs text string to the browser output stream in PHP?",
      options: [
        { id: 'a', text: 'echo' },
        { id: 'b', text: 'printf()' },
        { id: 'c', text: 'print_r()' },
        { id: 'd', text: 'write()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which function returns the number of elements in an array?",
      options: [
        { id: 'a', text: 'length()' },
        { id: 'b', text: 'count()' },
        { id: 'c', text: 'size()' },
        { id: 'd', text: 'elements()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What superglobal array stores session state across page reloads in PHP?",
      options: [
        { id: 'a', text: '$_SESSION' },
        { id: 'b', text: '$_COOKIE' },
        { id: 'c', text: '$_SERVER' },
        { id: 'd', text: '$_STATE' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What function must be called before accessing any $_SESSION variables?",
      options: [
        { id: 'a', text: 'session_init()' },
        { id: 'b', text: 'session_start()' },
        { id: 'c', text: 'session_open()' },
        { id: 'd', text: 'session_load()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "Which PDO method prepares a SQL statement safely against SQL injection?",
      options: [
        { id: 'a', text: 'query()' },
        { id: 'b', text: 'prepare()' },
        { id: 'c', text: 'execute()' },
        { id: 'd', text: 'sanitize()' }
      ],
      correct_answer: 'b',
      difficulty: 'medium'
    },
    {
      question: "What is an associative array in PHP?",
      options: [
        { id: 'a', text: 'An array where keys are named strings rather than numbers' },
        { id: 'b', text: 'An array linked to SQL tables' },
        { id: 'c', text: 'An array storing class instances' },
        { id: 'd', text: 'An array sorted automatically' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which function converts a PHP array or object into a JSON string?",
      options: [
        { id: 'a', text: 'json_encode()' },
        { id: 'b', text: 'json_decode()' },
        { id: 'c', text: 'json_stringify()' },
        { id: 'd', text: 'json_to_string()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which function decodes a JSON string into a PHP associative array?",
      options: [
        { id: 'a', text: 'json_decode($json, true)' },
        { id: 'b', text: 'json_encode($json)' },
        { id: 'c', text: 'json_parse($json)' },
        { id: 'd', text: 'json_to_array($json)' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What keyword defines a class constructor method in modern PHP?",
      options: [
        { id: 'a', text: 'construct()' },
        { id: 'b', text: '__construct()' },
        { id: 'c', text: 'new()' },
        { id: 'd', text: 'initialize()' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What namespace separator character is used in modern PHP?",
      options: [
        { id: 'a', text: '\\ (Backslash)' },
        { id: 'b', text: '/ (Slash)' },
        { id: 'c', text: '. (Dot)' },
        { id: 'd', text: ':: (Double Colon)' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What package dependency manager is standard for the PHP ecosystem?",
      options: [
        { id: 'a', text: 'Composer' },
        { id: 'b', text: 'npm' },
        { id: 'c', text: 'packagist' },
        { id: 'd', text: 'pip' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which operator is used for string concatenation in PHP?",
      options: [
        { id: 'a', text: '+' },
        { id: 'b', text: '.' },
        { id: 'c', text: '&' },
        { id: 'd', text: 'concat' }
      ],
      correct_answer: 'b',
      difficulty: 'easy'
    },
    {
      question: "What is the null coalescing operator ?? in PHP 7+?",
      options: [
        { id: 'a', text: 'Returns its first operand if it exists and is not NULL; otherwise, it returns its second' },
        { id: 'b', text: 'Compares two float values' },
        { id: 'c', text: 'Performs array division' },
        { id: 'd', text: 'Throws class warnings exception' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is the spaceship operator <=> in PHP 7+?",
      options: [
        { id: 'a', text: 'Returns -1, 0, or 1 based on comparison of two values' },
        { id: 'b', text: 'A dynamic pointer reference' },
        { id: 'c', text: 'A database query link operator' },
        { id: 'd', text: 'An encryption hash' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "Which keyword declares an anonymous function or closure in PHP?",
      options: [
        { id: 'a', text: 'function' },
        { id: 'b', text: 'fn' },
        { id: 'c', text: 'lambda' },
        { id: 'd', text: 'Both A and B are valid (PHP 7.4+)' }
      ],
      correct_answer: 'd',
      difficulty: 'medium'
    },
    {
      question: "What superglobal contains uploaded file metadata?",
      options: [
        { id: 'a', text: '$_FILES' },
        { id: 'b', text: '$_POST' },
        { id: 'c', text: '$_UPLOAD' },
        { id: 'd', text: '$_SERVER' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What function checks if a variable is set and is not NULL?",
      options: [
        { id: 'a', text: 'isset()' },
        { id: 'b', text: 'empty()' },
        { id: 'c', text: 'is_null()' },
        { id: 'd', text: 'exists()' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which framework is a popular modern PHP Web Framework?",
      options: [
        { id: 'a', text: 'Laravel' },
        { id: 'b', text: 'React' },
        { id: 'c', text: 'Django' },
        { id: 'd', text: 'Spring Boot' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What is OPcache in the PHP engine?",
      options: [
        { id: 'a', text: 'A database cache plugin' },
        { id: 'b', text: 'An extension that improves PHP performance by storing precompiled script bytecode in shared memory' },
        { id: 'c', text: 'An image compressor' },
        { id: 'd', text: 'A query debugger tool' }
      ],
      correct_answer: 'b',
      difficulty: 'hard'
    },
    {
      question: "What keyword declares strict type checking mode at the top of a PHP file?",
      options: [
        { id: 'a', text: 'declare(strict_types=1);' },
        { id: 'b', text: 'strict_mode = true;' },
        { id: 'c', text: 'use strict;' },
        { id: 'd', text: '#strict' }
      ],
      correct_answer: 'a',
      difficulty: 'medium'
    },
    {
      question: "What access modifier makes class properties accessible anywhere?",
      options: [
        { id: 'a', text: 'public' },
        { id: 'b', text: 'private' },
        { id: 'c', text: 'protected' },
        { id: 'd', text: 'global' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What access modifier restricts property access strictly inside the class?",
      options: [
        { id: 'a', text: 'private' },
        { id: 'b', text: 'protected' },
        { id: 'c', text: 'public' },
        { id: 'd', text: 'internal' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What access modifier allows property access in derived child classes but not outside?",
      options: [
        { id: 'a', text: 'protected' },
        { id: 'b', text: 'private' },
        { id: 'c', text: 'public' },
        { id: 'd', text: 'friend' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "Which PHP extension provides object-oriented database connectivity?",
      options: [
        { id: 'a', text: 'PDO' },
        { id: 'b', text: 'mysqli' },
        { id: 'c', text: 'pg_connect' },
        { id: 'd', text: 'sql_connect' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What function sets an HTTP cookie in the browser in PHP?",
      options: [
        { id: 'a', text: 'setcookie()' },
        { id: 'b', text: 'cookie()' },
        { id: 'c', text: 'save_cookie()' },
        { id: 'd', text: 'header("Cookie")' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    },
    {
      question: "What function redirects a user to another URL via HTTP headers?",
      options: [
        { id: 'a', text: 'header("Location: https://example.com");' },
        { id: 'b', text: 'redirect("https://example.com");' },
        { id: 'c', text: 'jump("https://example.com");' },
        { id: 'd', text: 'go("https://example.com");' }
      ],
      correct_answer: 'a',
      difficulty: 'easy'
    }
  ]
};

export function getOfflineQuestions(topic: string, count: number = 30): MCQQuestion[] {
  const normalized = (topic || '').toLowerCase().trim();
  let key = 'c';
  
  if (normalized.includes('c++') || normalized.includes('cpp')) key = 'cpp';
  else if (normalized.includes('java') && !normalized.includes('javascript')) key = 'java';
  else if (normalized.includes('py') || normalized.includes('python')) key = 'python';
  else if (normalized.includes('sql') || normalized.includes('db') || normalized.includes('database')) key = 'sql';
  else if (normalized.includes('js') || normalized.includes('javascript')) key = 'javascript';
  else if (normalized.includes('ts') || normalized.includes('typescript')) key = 'typescript';
  else if (normalized.includes('html') || normalized.includes('css')) key = 'html_css';
  else if (normalized.includes('react')) key = 'react';
  else if (normalized.includes('dsa') || normalized.includes('algo') || normalized.includes('structure')) key = 'dsa';
  else if (normalized.includes('go') || normalized.includes('golang')) key = 'go';
  else if (normalized.includes('rust')) key = 'rust';
  else if (normalized.includes('php')) key = 'php';
  else key = 'c';

  const list = staticQuestionsBank[key] || staticQuestionsBank['c'];
  
  // Shuffle list to get dynamic combinations if count is smaller
  const shuffled = [...list].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
