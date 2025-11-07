
'use client';

import { useEditor, EditorContent, BubbleMenu, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import { Mark, markInputRule, Extension, Node, mergeAttributes } from '@tiptap/core';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';


import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Link as LinkIcon,
  List, ListOrdered, CheckSquare, Quote, Image as ImageIcon, Table as TableIcon,
  AlignLeft, AlignCenter, AlignRight, Type, Pilcrow, Palette, Minus, Trash2, Eraser, Tags, ChevronsRight, ZoomIn, ZoomOut, Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Languages, Loader, Undo, Redo, FileDown, FileUp
} from 'lucide-react';
import React, { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge';
import { translateText } from '@/ai/flows/translator';
import { useToast } from '@/hooks/use-toast';

// --- Collapsible Text (Details) Extension ---

const Details = Node.create({
    name: 'details',
    group: 'block',
    content: 'summary block*',
    defining: true,
    isolating: true,
    addAttributes() {
        return {
            open: {
                default: true,
                parseHTML: element => element.hasAttribute('open'),
                renderHTML: attributes => ({ open: attributes.open }),
            },
        };
    },
    parseHTML() {
        return [{ tag: 'details' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['details', mergeAttributes(HTMLAttributes), 0];
    },
    addNodeView() {
        return ({ getPos, editor, node }) => {
            const dom = document.createElement('details');
            const summary = document.createElement('summary');
            const content = document.createElement('div');

            dom.open = node.attrs.open;

            summary.addEventListener('click', () => {
                if (typeof getPos === 'function') {
                    editor.view.dispatch(
                        editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
                            open: !dom.open,
                        })
                    );
                }
            });

            dom.append(summary, content);

            return {
                dom,
                contentDOM: content,
                update: (updatedNode) => {
                    if (updatedNode.type.name !== 'details') return false;
                    dom.open = updatedNode.attrs.open;
                    return true;
                },
            };
        };
    },
    addCommands() {
        return {
            setDetails: () => ({ commands }) => {
                return commands.wrapIn(this.type);
            },
            toggleDetails: () => ({ commands }) => {
                return commands.toggleNode(this.type, 'paragraph');
            },
        };
    },
});

const Summary = Node.create({
    name: 'summary',
    group: 'summary',
    content: 'text*',
    parseHTML() {
        return [{ tag: 'summary' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['summary', mergeAttributes(HTMLAttributes), 0];
    },
});


const FONT_FAMILIES = [
    'Inter', 'Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 
    'Helvetica', 'Tahoma', 'Trebuchet MS', 'Impact', 'Gill Sans', 'Palatino',
    'Baskerville', 'Andale Mono', 'Futura', 'Garamond', 'Bookman', 'Avant Garde',
    'Rockwell', 'Copperplate'
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px'];

const Hashtag = Mark.create({
    name: 'hashtag',
    inclusive: false,

    addOptions() {
        return {
            HTMLAttributes: {
                class: 'bg-primary/20 text-primary font-semibold rounded-md px-1.5 py-0.5',
            },
        };
    },

    parseHTML() {
        return [{ tag: 'span[data-hashtag]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', { ...HTMLAttributes, 'data-hashtag': '' }, 0];
    },

    addInputRules() {
        return [
            markInputRule({
                find: /(?:^|\s)(#\w+)\s$/,
                type: this.type,
            }),
        ];
    },
});

type FontSizeOptions = {
  types: string[],
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType,
      unsetFontSize: () => ReturnType,
    }
  }
}

const FontSize = Extension.create<FontSizeOptions>({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run()
      },
      unsetFontSize: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})


const ToolbarButton = ({ onClick, children, title, isActive, disabled }: { onClick: React.MouseEventHandler<HTMLButtonElement>, children: React.ReactNode, title: string, isActive?: boolean, disabled?: boolean }) => (
  <Button type="button" variant={isActive ? 'secondary' : 'ghost'} size="icon" onClick={onClick} title={title} disabled={disabled} className="h-7 w-7">
    {children}
  </Button>
);

const extractTags = (htmlString: string = '') => {
    if (!htmlString || typeof document === 'undefined') return [];
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    const tagElements = tempDiv.querySelectorAll('span[data-hashtag]');
    const tags = Array.from(tagElements).map(el => el.textContent || '').filter(Boolean);
    return [...new Set(tags)];
};


export default function RichTextEditor({ value, onChange, isEditable }: { value: string, onChange: (content: string) => void, isEditable: boolean }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tableGrid, setTableGrid] = useState({ rows: 0, cols: 0 });
  const { toast } = useToast();
  const [isTranslating, setIsTranslating] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { HTMLAttributes: { class: 'list-disc pl-4' } },
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-4' } },
        blockquote: { HTMLAttributes: { class: 'border-l-4 border-primary pl-4' } },
      }),
      Underline,
      Link.configure({ 
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer nofollow',
        },
      }),
      Image,
      Table.configure({ 
        resizable: true,
        HTMLAttributes: { class: 'border-collapse border border-border' },
      }),
      TableRow.configure({ HTMLAttributes: { class: 'border-b border-border' } }),
      TableHeader.configure({ HTMLAttributes: { class: 'bg-muted p-2 border border-border font-bold text-left' } }),
      TableCell.configure({ HTMLAttributes: { class: 'p-2 border border-border min-w-[4rem]' } }),
      FontFamily,
      TextStyle,
      FontSize,
      Color,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      Hashtag,
      Details,
      Summary,
      Superscript,
      Subscript,
    ],
    content: value,
    editable: isEditable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-full focus:outline-none p-4',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      if(value !== editor.getHTML()) {
        editor.commands.setContent(value, false);
      }
      if(editor.isEditable !== isEditable) {
        editor.setEditable(isEditable);
      }
    }
  }, [value, isEditable, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const { from, to, empty } = editor.view.state.selection;
    let text = editor.state.doc.textBetween(from, to, ' ');

    if (empty) {
        const currentPos = editor.state.selection.$from;
        let start = from;
        let end = to;

        currentPos.parent.nodesBetween(currentPos.pos - currentPos.parentOffset, currentPos.pos + (currentPos.parent.content.size - currentPos.parentOffset), (node, pos) => {
            if (node.isText) {
                const text = node.text as string;
                const match = text.match(/\S+/g);
                if (match) {
                    let runningPos = pos;
                    for (const m of match) {
                        const startIndex = text.indexOf(m, runningPos - pos);
                        const endIndex = startIndex + m.length;
                        if (pos + startIndex <= from && pos + endIndex >= to) {
                            start = pos + startIndex;
                            end = pos + endIndex;
                            break;
                        }
                        runningPos = pos + endIndex;
                    }
                }
            }
        });
        
        editor.commands.setTextSelection({ from: start, to: end });
        text = editor.state.doc.textBetween(start, end, " ");
    }
    
    const url = window.prompt('URL', previousUrl || (text.startsWith('http') ? text : 'https://'));

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    }
    if(event.target) {
        event.target.value = '';
    }
  };
  
  const addCollapsible = useCallback(() => {
    editor?.chain().focus().insertContent('<details open><summary>Summary</summary><p>Content...</p></details>').run();
  }, [editor]);

  const changeFontSize = useCallback((direction: 'increase' | 'decrease') => {
    if(!editor) return;

    const currentSizeAttr = editor.getAttributes('textStyle').fontSize;
    let currentSize = 16; // default
    if(currentSizeAttr && currentSizeAttr.endsWith('px')) {
      currentSize = parseInt(currentSizeAttr, 10);
    }
    
    const newSize = direction === 'increase' ? currentSize + 2 : currentSize - 2;
    const clampedSize = Math.max(10, Math.min(60, newSize)); // Clamp between 10px and 60px

    editor.chain().focus().setFontSize(`${clampedSize}px`).run();
  }, [editor]);

  const handleTranslate = useCallback(async (targetLanguage: string) => {
    if (!editor) return;
    const { from, to, empty } = editor.view.state.selection;
    if (empty) {
        toast({ title: 'No text selected', description: 'Please select the text you want to translate.', variant: 'destructive' });
        return;
    }

    const textToTranslate = editor.state.doc.textBetween(from, to, ' ');
    setIsTranslating(true);
    
    try {
        const result = await translateText({ text: textToTranslate, targetLanguage });
        if (result.translatedText) {
            editor.chain().focus().insertContentAt({ from, to }, result.translatedText).run();
        } else {
             throw new Error("Received empty translation.");
        }
    } catch(e) {
        toast({ title: 'Translation Failed', description: 'Could not translate the text at this time.', variant: 'destructive' });
    } finally {
        setIsTranslating(false);
    }
  }, [editor, toast]);
  
  const extractedTags = useMemo(() => extractTags(value), [value]);

  if (!editor) {
    return null;
  }
  
  if (!isEditable) {
    return (
      <div className="h-full overflow-y-auto p-4 prose dark:prose-invert max-w-full tiptap"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return (
    <div ref={editorRef} className="h-full flex flex-col border rounded-md relative overflow-hidden">
        {isEditable && (
            <div className="p-1 border-b flex items-center gap-1 flex-wrap sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo"><Undo className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo"><Redo className="h-4 w-4"/></ToolbarButton>
          <Separator orientation="vertical" className="h-5 mx-1"/>

          {/* Text Style */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline"><UnderlineIcon className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} isActive={editor.isActive('superscript')} title="Superscript"><SuperscriptIcon className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} isActive={editor.isActive('subscript')} title="Subscript"><SubscriptIcon className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Clear Format"><Eraser className="h-4 w-4"/></ToolbarButton>
          <Separator orientation="vertical" className="h-5 mx-1"/>
          
          {/* Headings */}
           <Popover>
            <PopoverTrigger asChild><Button type="button" variant="ghost" size="xs" className="px-2 h-7">Format</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-1">
                    <div className="flex flex-col">
                    <Button type="button" variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="justify-start">Heading 1</Button>
                    <Button type="button" variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="justify-start">Heading 2</Button>
                    <Button type="button" variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="justify-start">Heading 3</Button>
                    <Button type="button" variant={editor.isActive('paragraph') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().setParagraph().run()} className="justify-start">Paragraph</Button>
                    </div>
                </PopoverContent>
          </Popover>

          {/* Font Family */}
          <Popover>
            <PopoverTrigger asChild><Button type="button" variant="ghost" size="xs" className="px-2 h-7">Font</Button></PopoverTrigger>
                <PopoverContent className="w-48 p-1 max-h-60 overflow-y-auto">
                    {FONT_FAMILIES.map(font => (
                        <Button type="button" key={font} variant={editor.isActive('textStyle', { fontFamily: font }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().setFontFamily(font).run()} className="justify-start w-full" style={{fontFamily: font}}>{font}</Button>
                    ))}
                </PopoverContent>
          </Popover>

          {/* Font Size */}
           <ToolbarButton onClick={() => changeFontSize('decrease')} title="Decrease font size"><ZoomOut className="h-4 w-4"/></ToolbarButton>
           <ToolbarButton onClick={() => changeFontSize('increase')} title="Increase font size"><ZoomIn className="h-4 w-4"/></ToolbarButton>
          
          {/* Colors */}
          <Popover>
            <PopoverTrigger asChild><Button type="button" variant="ghost" size="xs" className="px-2 h-7"><Palette className="h-4 w-4 mr-1"/> Color</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-2 space-y-2">
                        <div className="flex items-center gap-2">
                            <label htmlFor="textColor" className="text-sm">Text</label>
                            <input id="textColor" type="color" className="w-8 h-8" value={editor.getAttributes('textStyle').color || '#ffffff'} onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().unsetColor().run()}>Reset</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="bgColor" className="text-sm">Highlight</label>
                            <input id="bgColor" type="color" className="w-8 h-8" value={editor.getAttributes('highlight').color || '#000000'} onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} />
                            <Button type="button" variant="ghost" size="sm" onClick={() => editor.chain().focus().unsetHighlight().run()}>Reset</Button>
                        </div>
                </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-5 mx-1"/>

          {/* Lists */}
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bulleted List"><List className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List"><ListOrdered className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="To-do List"><CheckSquare className="h-4 w-4"/></ToolbarButton>
          
          <Separator orientation="vertical" className="h-5 mx-1"/>
          
          {/* Alignment */}
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left"><AlignLeft className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center"><AlignCenter className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right"><AlignRight className="h-4 w-4"/></ToolbarButton>
          
          <Separator orientation="vertical" className="h-5 mx-1"/>

          {/* Special Elements */}
          <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="Add Link"><LinkIcon className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote"><Quote className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block"><Code className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={addImage} title="Add Image"><ImageIcon className="h-4 w-4"/></ToolbarButton>
          <ToolbarButton onClick={addCollapsible} title="Add Collapsible Content"><ChevronsRight className="h-4 w-4"/></ToolbarButton>

          {/* Table Controls */}
            <Popover>
                <PopoverTrigger asChild>
                    <ToolbarButton onClick={() => {}} title="Table Options"><TableIcon className="h-4 w-4" /></ToolbarButton>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" onMouseLeave={() => setTableGrid({ rows: 0, cols: 0 })}>
                    <p className="text-xs text-center mb-2">{tableGrid.rows > 0 ? `${tableGrid.rows}x${tableGrid.cols}` : 'Insert Table'}</p>
                    <div className="grid grid-cols-10 gap-1">
                        {Array.from({ length: 100 }).map((_, i) => {
                            const row = Math.floor(i / 10) + 1;
                            const col = (i % 10) + 1;
                            return (
                                <div
                                    key={i}
                                    onMouseEnter={() => setTableGrid({ rows: row, cols: col })}
                                    onClick={() => editor.chain().focus().insertTable({ rows: row, cols: col, withHeaderRow: true }).run()}
                                    className={cn(
                                        "w-4 h-4 border border-border cursor-pointer",
                                        row <= tableGrid.rows && col <= tableGrid.cols && "bg-primary"
                                    )}
                                />
                            );
                        })}
                    </div>
                </PopoverContent>
            </Popover>
            
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <ToolbarButton onClick={()=>{}} title="Table Actions" disabled={!editor.can().deleteTable()}>
                        <TableIcon className="h-4 w-4" />
                    </ToolbarButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()} disabled={!editor.can().addColumnBefore()}>Add Column Before</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()}>Add Column After</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()} disabled={!editor.can().addRowBefore()}>Add Row Before</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}>Add Row After</DropdownMenuItem>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} disabled={!editor.can().deleteColumn()} className="text-destructive">Delete Column</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} disabled={!editor.can().deleteRow()} className="text-destructive">Delete Row</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()} className="text-destructive">Delete Table</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-4 w-4"/></ToolbarButton>
        
            <Separator orientation="vertical" className="h-5 mx-1"/>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isTranslating} className="h-7 px-2">
                        {isTranslating ? <Loader className="h-4 w-4 animate-spin"/> : <Languages className="h-4 w-4"/>}
                        <span className="ml-2 hidden lg:inline">Translate</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleTranslate('English')}>English</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleTranslate('Urdu')}>Urdu</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleTranslate('Spanish')}>Spanish</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleTranslate('French')}>French</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleTranslate('German')}>German</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleTranslate('Arabic')}>Arabic</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleTranslate('Chinese')}>Chinese</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
            <Button variant="ghost" size="sm" className="h-7 px-2" disabled><FileUp className="h-4 w-4"/><span className="ml-2 hidden lg:inline">Import</span></Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" disabled><FileDown className="h-4 w-4"/><span className="ml-2 hidden lg:inline">Export</span></Button>
        </div>
      )}

      {editor && <BubbleMenu className="flex items-center gap-1 p-1 rounded-md bg-background border shadow-md" editor={editor} 
        tippyOptions={{ 
            duration: 100, 
            appendTo: () => editorRef.current || document.body
        }}
      >
        {editor.isActive('image') ? (
            <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => editor.chain().focus().deleteSelection().run()}
            >
                <Trash2 className="h-4 w-4 mr-2" /> Delete image
            </Button>
        ) : (
            <>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold className="h-4 w-4"/></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic className="h-4 w-4"/></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="h-4 w-4"/></ToolbarButton>
                <Button type="button" variant={editor.isActive('link') ? 'secondary' : 'ghost'} size="icon" onClick={setLink} title="Link" className="h-7 w-7"><LinkIcon className="h-4 w-4"/></Button>
            </>
        )}
      </BubbleMenu>}
      
      <div className="flex-1 overflow-y-auto tiptap">
        <EditorContent editor={editor} />
      </div>

      {isEditable && extractedTags.length > 0 && (
            <div className="border-t p-2 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Tags className="h-4 w-4" />
                    <span>Tags in this note</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {extractedTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
            </div>
        )}
    </div>
  );
}

    